"""Create banners table

Revision ID: 001
Revises: 
Create Date: 2024-11-05

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create banners table"""
    op.create_table(
        'banners',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('message', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('background_color', sa.String(), nullable=False, server_default='#fce7f3'),
        sa.Column('text_color', sa.String(), nullable=False, server_default='#831843'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_banners_id'), 'banners', ['id'], unique=False)
    
    # Insérer une bannière par défaut
    op.execute("""
        INSERT INTO banners (message, is_active, background_color, text_color)
        VALUES ('💌 Bienvenue sur StelleWorld ! Découvrez nos nouveaux produits.', true, '#fce7f3', '#831843')
    """)


def downgrade() -> None:
    """Drop banners table"""
    op.drop_index(op.f('ix_banners_id'), table_name='banners')
    op.drop_table('banners')

