import os
import secrets
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, session, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__, static_folder='.')
app.secret_key = os.urandom(24)

# Database Config
db_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'freelance.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default='freelancer') # 'freelancer' or 'client_poster'
    reset_token = db.Column(db.String(100), nullable=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)
    
    clients = db.relationship('Client', backref='user', lazy=True, cascade="all, delete-orphan")
    invoices = db.relationship('Invoice', backref='user', lazy=True, cascade="all, delete-orphan")
    expenses_rel = db.relationship('Expense', backref='user', lazy=True, cascade="all, delete-orphan")
    jobs = db.relationship('Job', backref='employer', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Client(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone
        }

class Invoice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(50), nullable=True)
    client_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    date = db.Column(db.String(50), nullable=False)
    due_date = db.Column(db.String(50), nullable=True)
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50), nullable=False) # 'BaridiMob', 'CCP', 'Espèces'
    status = db.Column(db.String(20), default='En attente') # 'Payée', 'En attente'
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'invoice_number': self.invoice_number or f'INV-{self.id}',
            'client_name': self.client_name,
            'description': self.description or '',
            'date': self.date,
            'due_date': self.due_date or '',
            'amount': self.amount,
            'payment_method': self.payment_method,
            'status': self.status
        }

class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.String(50), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'description': self.description,
            'amount': self.amount,
            'date': self.date
        }

class Job(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    budget = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'budget': self.budget,
            'category': self.category,
            'created_at': self.created_at.strftime('%d/%m/%Y'),
            'employer_name': self.employer.username
        }

# Initialise Database
with app.app_context():
    db.create_all()
    # Migrate: safely add missing columns to all tables
    import sqlite3 as _sqlite3
    _conn = _sqlite3.connect(db_path)
    _cur = _conn.cursor()

    # --- user table ---
    _cur.execute("PRAGMA table_info(user)")
    _user_cols = [col[1] for col in _cur.fetchall()]
    _user_migrations = [
        ("role",                "ALTER TABLE user ADD COLUMN role VARCHAR(20) DEFAULT 'freelancer'"),
        ("reset_token",         "ALTER TABLE user ADD COLUMN reset_token VARCHAR(100)"),
        ("reset_token_expires", "ALTER TABLE user ADD COLUMN reset_token_expires DATETIME"),
    ]
    for _col, _sql in _user_migrations:
        if _col not in _user_cols:
            _cur.execute(_sql)

    # --- invoice table ---
    _cur.execute("PRAGMA table_info(invoice)")
    _inv_cols = [col[1] for col in _cur.fetchall()]
    _inv_migrations = [
        ("invoice_number", "ALTER TABLE invoice ADD COLUMN invoice_number VARCHAR(50)"),
        ("description",    "ALTER TABLE invoice ADD COLUMN description TEXT"),
        ("due_date",       "ALTER TABLE invoice ADD COLUMN due_date VARCHAR(50)"),
    ]
    for _col, _sql in _inv_migrations:
        if _col not in _inv_cols:
            _cur.execute(_sql)

    _conn.commit()
    _conn.close()

# Serve static files from root
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/style.css')
def serve_css():
    return send_from_directory('.', 'style.css')

@app.route('/app.js')
def serve_js():
    return send_from_directory('.', 'app.js')

# Auth API Endpoints
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'freelancer')

    if not username or not email or not password:
        return jsonify({'error': 'Champs requis manquants'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Cet email est déjà enregistré'}), 400

    user = User(username=username, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    session['user_id'] = user.id
    return jsonify({'message': 'Inscription réussie', 'user': {'id': user.id, 'username': user.username, 'email': user.email, 'role': user.role}})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Veuillez saisir votre email et mot de passe'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Email ou mot de passe incorrect'}), 401

    session['user_id'] = user.id
    return jsonify({'message': 'Connexion réussie', 'user': {'id': user.id, 'username': user.username, 'email': user.email, 'role': user.role}})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Déconnexion réussie'})

@app.route('/api/me', methods=['GET'])
def get_me():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Non authentifié'}), 401
    
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'Utilisateur introuvable'}), 404
        
    return jsonify({'user': {'id': user.id, 'username': user.username, 'email': user.email, 'role': user.role}})

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email')
    if not email:
        return jsonify({'error': 'Veuillez saisir votre email'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        # Prevent user enumeration but provide a safe indicator
        return jsonify({'error': 'Aucun compte associé à cet email'}), 404

    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.session.commit()

    # In local dev environment, return the token so the front-end can display the dev link
    dev_link = f"http://localhost:5173/#reset-password?token={token}"
    return jsonify({
        'message': 'Token de réinitialisation généré',
        'dev_link': dev_link
    })

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    token = data.get('token')
    password = data.get('password')

    if not token or not password:
        return jsonify({'error': 'Données de réinitialisation incorrectes'}), 400

    user = User.query.filter(
        User.reset_token == token,
        User.reset_token_expires > datetime.utcnow()
    ).first()

    if not user:
        return jsonify({'error': 'Le token est invalide ou a expiré'}), 400

    user.set_password(password)
    user.reset_token = None
    user.reset_token_expires = None
    db.session.commit()

    return jsonify({'message': 'Mot de passe réinitialisé avec succès'})

# User Update API (Change Name & Email)
@app.route('/api/user/update', methods=['POST'])
def update_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Non authentifié'}), 401
    
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'Utilisateur introuvable'}), 404
        
    data = request.get_json() or {}
    username = data.get('username')
    email = data.get('email')
    
    if username is not None:
        if not username.strip():
            return jsonify({'error': 'Le nom d\'utilisateur ne peut pas être vide'}), 400
        user.username = username.strip()

    if email is not None:
        email_clean = email.strip().lower()
        if not email_clean:
            return jsonify({'error': 'L\'email ne peut pas être vide'}), 400
        existing = User.query.filter(User.email == email_clean, User.id != user_id).first()
        if existing:
            return jsonify({'error': 'Cet email est déjà utilisé par un autre compte'}), 400
        user.email = email_clean

    db.session.commit()
    
    return jsonify({'message': 'Profil mis à jour avec succès', 'user': {'id': user.id, 'username': user.username, 'email': user.email, 'role': user.role}})

# Change Password API
@app.route('/api/user/change-password', methods=['POST'])
def change_password():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Non authentifié'}), 401

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'Utilisateur introuvable'}), 404

    data = request.get_json() or {}
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not current_password or not new_password:
        return jsonify({'error': 'Veuillez saisir votre mot de passe actuel et le nouveau mot de passe'}), 400

    if not user.check_password(current_password):
        return jsonify({'error': 'Mot de passe actuel incorrect'}), 400

    if len(new_password) < 6:
        return jsonify({'error': 'Le nouveau mot de passe doit contenir au moins 6 caractères'}), 400

    user.set_password(new_password)
    db.session.commit()

    return jsonify({'message': 'Mot de passe modifié avec succès'})

# Client CRUD API
@app.route('/api/clients', methods=['GET', 'POST'])
def handle_clients():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Non authentifié'}), 401

    if request.method == 'GET':
        search_query = request.args.get('q', '').strip()
        if search_query:
            clients = Client.query.filter(Client.user_id == user_id, Client.name.contains(search_query)).all()
        else:
            clients = Client.query.filter_by(user_id=user_id).all()
        return jsonify([c.to_dict() for c in clients])

    elif request.method == 'POST':
        data = request.get_json() or {}
        name = data.get('name')
        email = data.get('email')
        phone = data.get('phone')

        if not name:
            return jsonify({'error': 'Le nom du client est requis'}), 400

        client = Client(name=name, email=email, phone=phone, user_id=user_id)
        db.session.add(client)
        db.session.commit()
        return jsonify(client.to_dict()), 201

@app.route('/api/clients/<int:client_id>', methods=['PUT', 'DELETE'])
def update_delete_client(client_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Non authentifié'}), 401

    client = Client.query.filter_by(id=client_id, user_id=user_id).first()
    if not client:
        return jsonify({'error': 'Client introuvable'}), 404

    if request.method == 'PUT':
        data = request.get_json() or {}
        client.name = data.get('name', client.name)
        client.email = data.get('email', client.email)
        client.phone = data.get('phone', client.phone)
        db.session.commit()
        return jsonify(client.to_dict())

    elif request.method == 'DELETE':
        db.session.delete(client)
        db.session.commit()
        return jsonify({'message': 'Client supprimé'})

# Invoices API
@app.route('/api/invoices', methods=['POST'])
def create_invoice():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Non authentifié'}), 401

    data = request.get_json() or {}
    client_name    = (data.get('client_name') or '').strip()
    description    = (data.get('description') or '').strip()
    invoice_number = (data.get('invoice_number') or '').strip()
    date           = (data.get('date') or '').strip()
    due_date       = (data.get('due_date') or '').strip() or None
    status         = data.get('status', 'En attente')
    payment_method = data.get('payment_method', 'Espèces')
    amount         = data.get('amount')

    # Validation
    if not client_name:
        return jsonify({'error': 'Le nom du client est requis'}), 400
    if not date:
        return jsonify({'error': "La date d'émission est requise"}), 400
    if amount is None or amount == '':
        return jsonify({'error': 'Le montant est requis'}), 400
    try:
        amount_val = float(amount)
        if amount_val <= 0:
            return jsonify({'error': 'Le montant doit être supérieur à 0 DA'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Montant invalide'}), 400

    # Auto-generate invoice number if not provided
    if not invoice_number:
        count = Invoice.query.filter_by(user_id=user_id).count()
        invoice_number = f"INV-{datetime.utcnow().year}-{str(count + 1).zfill(4)}"

    invoice = Invoice(
        invoice_number=invoice_number,
        client_name=client_name,
        description=description if description else None,
        date=date,
        due_date=due_date,
        amount=amount_val,
        payment_method=payment_method,
        status=status,
        user_id=user_id
    )
    db.session.add(invoice)
    db.session.commit()

    return jsonify(invoice.to_dict()), 201

# Expenses API
@app.route('/api/expenses', methods=['GET', 'POST'])
def handle_expenses():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Non authentifié'}), 401

    if request.method == 'GET':
        expenses = Expense.query.filter_by(user_id=user_id).all()
        return jsonify([e.to_dict() for e in expenses])

    elif request.method == 'POST':
        data = request.get_json() or {}
        description = (data.get('description') or '').strip()
        date = (data.get('date') or '').strip()
        amount = data.get('amount')

        if not description:
            return jsonify({'error': 'La description de la dépense est requise'}), 400
        if not date:
            return jsonify({'error': 'La date de la dépense est requise'}), 400
        if amount is None or amount == '':
            return jsonify({'error': 'Le montant de la dépense est requis'}), 400

        try:
            amount_val = float(amount)
            if amount_val <= 0:
                return jsonify({'error': 'Le montant doit être supérieur à 0 DA'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Montant invalide'}), 400

        expense = Expense(
            description=description,
            amount=amount_val,
            date=date,
            user_id=user_id
        )
        db.session.add(expense)
        db.session.commit()

        return jsonify(expense.to_dict()), 201

@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Non authentifié'}), 401

    expense = Expense.query.filter_by(id=expense_id, user_id=user_id).first()
    if not expense:
        return jsonify({'error': 'Dépense introuvable'}), 404

    db.session.delete(expense)
    db.session.commit()

    return jsonify({'message': 'Dépense supprimée avec succès'})

# Jobs API (Explorer: Find Work)
@app.route('/api/jobs', methods=['GET', 'POST'])
def handle_jobs():
    if request.method == 'GET':
        search_query = request.args.get('q', '').strip()
        if search_query:
            jobs = Job.query.filter(Job.title.contains(search_query) | Job.description.contains(search_query)).all()
        else:
            jobs = Job.query.all()
        return jsonify([j.to_dict() for j in jobs])
        
    elif request.method == 'POST':
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Non authentifié pour publier'}), 401
            
        data = request.get_json() or {}
        title = data.get('title')
        description = data.get('description')
        budget = data.get('budget')
        category = data.get('category')
        
        if not title or not description or not budget or not category:
            return jsonify({'error': 'Tous les champs requis pour publier une mission'}), 400
            
        try:
            budget_val = float(budget)
        except ValueError:
            return jsonify({'error': 'Budget doit être numérique'}), 400
            
        job = Job(title=title, description=description, budget=budget_val, category=category, user_id=user_id)
        db.session.add(job)
        db.session.commit()
        return jsonify(job.to_dict()), 210

# Freelancers API (Explorer: Recruit a Talent)
@app.route('/api/freelancers', methods=['GET'])
def get_freelancers():
    # Only list registered users who are freelancers
    freelancers = User.query.filter_by(role='freelancer').all()
    return jsonify([
        {
            'id': f.id,
            'username': f.username,
            'email': f.email
        } for f in freelancers
    ])

# Dashboard Stats & Invoices API
@app.route('/api/dashboard/data', methods=['GET'])
def get_dashboard_data():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Non authentifié'}), 401

    invoices = Invoice.query.filter_by(user_id=user_id).all()
    expenses_list = Expense.query.filter_by(user_id=user_id).all()
    
    total_revenue = sum(inv.amount for inv in invoices if inv.status == 'Payée')
    expenses = sum(exp.amount for exp in expenses_list)
    profit = max(0.0, total_revenue - expenses)
    unpaid = sum(inv.amount for inv in invoices if inv.status == 'En attente')

    # Monthly chart data calculation based on real invoices
    monthly_data = {
        'Jan': 0, 'Féb': 0, 'Mar': 0, 'Avr': 0, 'Mai': 0, 'Juin': 0
    }
    
    for inv in invoices:
        if inv.status == 'Payée':
            # Simple month match based on invoice date content
            for month in monthly_data.keys():
                if month.lower() in inv.date.lower() or month[:3].lower() in inv.date.lower():
                    monthly_data[month] += inv.amount
                    break

    return jsonify({
        'stats': {
            'revenue': f"{total_revenue:,.0f} DA".replace(",", " "),
            'expenses': f"{expenses:,.0f} DA".replace(",", " "),
            'profit': f"{profit:,.0f} DA".replace(",", " "),
            'unpaid': f"{unpaid:,.0f} DA".replace(",", " "),
        },
        'invoices': [inv.to_dict() for inv in invoices],
        'chart': monthly_data
    })

if __name__ == '__main__':
    app.run(port=5173, debug=True)
