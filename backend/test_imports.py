#!/usr/bin/env python3
"""
Test script to check if models can be imported without errors
"""

try:
    print("Testing imports...")
    
    # Test database configuration
    from app.core.database import Base, engine
    print("✓ Database configuration imported successfully")
    
    # Test models
    from app.models.user import User
    print("✓ User model imported successfully")
    
    from app.models.product import Product, Category
    print("✓ Product models imported successfully")
    
    from app.models.order import Order, OrderItem
    print("✓ Order models imported successfully")
    
    from app.models.subscription import Subscription, SubscriptionStatus
    print("✓ Subscription models imported successfully")
    
    from app.models.appointment import Appointment
    print("✓ Appointment model imported successfully")
    
    from app.models.chat import ChatConversation, ChatMessage
    print("✓ Chat models imported successfully")
    
    print("\n🎉 All models imported successfully!")
    
    # Test database connection
    print("\nTesting database connection...")
    with engine.connect() as conn:
        print("✓ Database connection successful")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
