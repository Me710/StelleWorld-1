"""
Classes de base pour les services métier
Implémentation des principes SOLID
"""

from abc import ABC, abstractmethod
from typing import TypeVar, Generic, List, Optional, Any
from sqlalchemy.orm import Session

# Type variable pour le modèle
T = TypeVar('T')


class IRepository(ABC, Generic[T]):
    """
    Interface Repository - Abstraction pour l'accès aux données
    
    Principe: Dependency Inversion (DIP)
    Les services dépendent de cette abstraction, pas d'une implémentation concrète.
    """
    
    @abstractmethod
    def get_by_id(self, id: int) -> Optional[T]:
        """Récupérer une entité par son ID"""
        pass
    
    @abstractmethod
    def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        """Récupérer toutes les entités avec pagination"""
        pass
    
    @abstractmethod
    def create(self, entity: T) -> T:
        """Créer une nouvelle entité"""
        pass
    
    @abstractmethod
    def update(self, entity: T) -> T:
        """Mettre à jour une entité"""
        pass
    
    @abstractmethod
    def delete(self, id: int) -> bool:
        """Supprimer une entité"""
        pass


class BaseRepository(IRepository[T]):
    """
    Repository de base - Implémentation générique
    
    Principe: Single Responsibility (SRP)
    S'occupe uniquement de l'accès aux données.
    """
    
    def __init__(self, db: Session, model_class):
        self.db = db
        self.model_class = model_class
    
    def get_by_id(self, id: int) -> Optional[T]:
        return self.db.query(self.model_class).filter(self.model_class.id == id).first()
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        return self.db.query(self.model_class).offset(skip).limit(limit).all()
    
    def create(self, entity: T) -> T:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity
    
    def update(self, entity: T) -> T:
        self.db.commit()
        self.db.refresh(entity)
        return entity
    
    def delete(self, id: int) -> bool:
        entity = self.get_by_id(id)
        if entity:
            self.db.delete(entity)
            self.db.commit()
            return True
        return False


class IService(ABC):
    """
    Interface Service de base
    
    Principe: Interface Segregation (ISP)
    Interface minimale que tous les services doivent implémenter.
    """
    
    @abstractmethod
    def validate(self, data: dict) -> bool:
        """Valider les données"""
        pass


class BaseService(IService):
    """
    Service de base - Template pour les services métier
    
    Principe: Open/Closed (OCP)
    Cette classe est ouverte à l'extension via l'héritage,
    mais fermée à la modification.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def validate(self, data: dict) -> bool:
        """Validation de base - à surcharger dans les sous-classes"""
        return True
    
    def _log_action(self, action: str, entity_type: str, entity_id: int):
        """Log une action (peut être étendu pour audit trail)"""
        # En production, implémenter un vrai système de logging
        print(f"[{action}] {entity_type} #{entity_id}")


class INotificationSender(ABC):
    """
    Interface pour les envoyeurs de notifications
    
    Principe: Interface Segregation (ISP)
    Interface spécifique pour les notifications.
    """
    
    @abstractmethod
    def send(self, recipient: str, message: str) -> bool:
        """Envoyer une notification"""
        pass


class IPriceCalculator(ABC):
    """
    Interface pour les calculateurs de prix
    
    Principe: Interface Segregation (ISP)
    Permet différentes stratégies de calcul de prix.
    """
    
    @abstractmethod
    def calculate_total(self, items: List[dict]) -> float:
        """Calculer le total"""
        pass
    
    @abstractmethod
    def calculate_tax(self, subtotal: float) -> float:
        """Calculer les taxes"""
        pass
    
    @abstractmethod
    def apply_discount(self, total: float, discount_code: str) -> float:
        """Appliquer une remise"""
        pass
