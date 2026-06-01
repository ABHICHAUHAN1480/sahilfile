from collections import defaultdict
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Customer, Order, OrderItem, Product
from app.schemas import OrderCreate, OrderRead

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)) -> Order:
    customer = db.get(Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")

    requested_quantities: dict[int, int] = defaultdict(int)
    for item in payload.items:
        requested_quantities[item.product_id] += item.quantity

    product_ids = list(requested_quantities.keys())
    products = list(
        db.scalars(select(Product).where(Product.id.in_(product_ids)).with_for_update()).all()
    )
    product_by_id = {product.id: product for product in products}
    missing_ids = sorted(set(product_ids) - set(product_by_id))
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product(s) not found: {', '.join(str(product_id) for product_id in missing_ids)}.",
        )

    for product_id, quantity in requested_quantities.items():
        product = product_by_id[product_id]
        if product.quantity_in_stock < quantity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Insufficient inventory for {product.name}. Available: {product.quantity_in_stock}.",
            )

    order_items: list[OrderItem] = []
    total_amount = Decimal("0.00")
    for product_id, quantity in requested_quantities.items():
        product = product_by_id[product_id]
        line_total = product.price * quantity
        total_amount += line_total
        product.quantity_in_stock -= quantity
        order_items.append(
            OrderItem(
                product_id=product.id,
                product_name=product.name,
                product_sku=product.sku,
                quantity=quantity,
                unit_price=product.price,
                line_total=line_total,
            )
        )

    order = Order(
        customer_id=customer.id,
        customer_name=customer.full_name,
        customer_email=customer.email,
        total_amount=total_amount,
        items=order_items,
    )
    db.add(order)
    db.commit()
    return _get_order_or_404(order.id, db)


@router.get("", response_model=list[OrderRead])
def list_orders(db: Session = Depends(get_db)) -> list[Order]:
    return list(
        db.scalars(select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc())).all()
    )


@router.get("/{order_id}", response_model=OrderRead)
def get_order(order_id: int, db: Session = Depends(get_db)) -> Order:
    return _get_order_or_404(order_id, db)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)) -> Response:
    order = _get_order_or_404(order_id, db)
    db.delete(order)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _get_order_or_404(order_id: int, db: Session) -> Order:
    order = db.scalars(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    ).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    return order
