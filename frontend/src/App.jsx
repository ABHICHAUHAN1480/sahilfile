import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ClipboardList,
  Eye,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  ShoppingCart,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { apiFetch } from './api';

const emptyProduct = { name: '', sku: '', price: '', quantity_in_stock: '' };
const emptyCustomer = { full_name: '', email: '', phone_number: '' };

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: ClipboardList },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState(null);
  const [customerForm, setCustomerForm] = useState(emptyCustomer);
  const [orderForm, setOrderForm] = useState({ customer_id: '', product_id: '', quantity: 1 });
  const [orderItems, setOrderItems] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const lowStockProducts = useMemo(
    () => products.filter((product) => Number(product.quantity_in_stock) <= 5),
    [products],
  );

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll({ clearOnSuccess = false } = {}) {
    setLoading(true);
    try {
      const [summaryData, productsData, customersData, ordersData] = await Promise.all([
        apiFetch('/dashboard/summary'),
        apiFetch('/products'),
        apiFetch('/customers'),
        apiFetch('/orders'),
      ]);
      setSummary(summaryData);
      setProducts(productsData);
      setCustomers(customersData);
      setOrders(ordersData);
      if (clearOnSuccess) {
        clearMessage();
      }
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function showMessage(text, type = 'success') {
    setMessage({ text, type });
  }

  function clearMessage() {
    setMessage(null);
  }

  function updateProductField(field, value) {
    setProductForm((current) => ({ ...current, [field]: value }));
  }

  function updateCustomerField(field, value) {
    setCustomerForm((current) => ({ ...current, [field]: value }));
  }

  async function saveProduct(event) {
    event.preventDefault();
    const payload = {
      ...productForm,
      price: Number(productForm.price),
      quantity_in_stock: Number(productForm.quantity_in_stock),
    };

    try {
      if (editingProductId) {
        await apiFetch(`/products/${editingProductId}`, { method: 'PUT', body: JSON.stringify(payload) });
        showMessage('Product updated.');
      } else {
        await apiFetch('/products', { method: 'POST', body: JSON.stringify(payload) });
        showMessage('Product added.');
      }
      setProductForm(emptyProduct);
      setEditingProductId(null);
      await loadAll();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  }

  function editProduct(product) {
    setProductForm({
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity_in_stock: product.quantity_in_stock,
    });
    setEditingProductId(product.id);
  }

  async function deleteProduct(productId) {
    try {
      await apiFetch(`/products/${productId}`, { method: 'DELETE' });
      showMessage('Product deleted.');
      await loadAll();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  }

  async function createCustomer(event) {
    event.preventDefault();
    try {
      await apiFetch('/customers', { method: 'POST', body: JSON.stringify(customerForm) });
      setCustomerForm(emptyCustomer);
      showMessage('Customer added.');
      await loadAll();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  }

  async function deleteCustomer(customerId) {
    try {
      await apiFetch(`/customers/${customerId}`, { method: 'DELETE' });
      showMessage('Customer deleted.');
      await loadAll();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  }

  function addOrderItem(event) {
    event.preventDefault();
    const product = products.find((item) => item.id === Number(orderForm.product_id));
    const quantity = Number(orderForm.quantity);
    if (!product || quantity < 1) {
      showMessage('Choose a product and quantity.', 'error');
      return;
    }

    setOrderItems((current) => {
      const existing = current.find((item) => item.product_id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product_id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        );
      }
      return [...current, { product_id: product.id, product_name: product.name, quantity }];
    });
    setOrderForm((current) => ({ ...current, product_id: '', quantity: 1 }));
  }

  async function createOrder(event) {
    event.preventDefault();
    if (!orderForm.customer_id || orderItems.length === 0) {
      showMessage('Choose a customer and at least one product.', 'error');
      return;
    }

    try {
      await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: Number(orderForm.customer_id),
          items: orderItems.map(({ product_id, quantity }) => ({ product_id, quantity })),
        }),
      });
      setOrderItems([]);
      setOrderForm({ customer_id: '', product_id: '', quantity: 1 });
      showMessage('Order created.');
      await loadAll();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  }

  async function openOrder(orderId) {
    try {
      const order = await apiFetch(`/orders/${orderId}`);
      setSelectedOrder(order);
    } catch (error) {
      showMessage(error.message, 'error');
    }
  }

  async function deleteOrder(orderId) {
    try {
      await apiFetch(`/orders/${orderId}`, { method: 'DELETE' });
      setSelectedOrder(null);
      showMessage('Order deleted.');
      await loadAll();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Package size={22} />
          </div>
          <div>
            <strong>Stockroom</strong>
            <span>Inventory & Orders</span>
          </div>
        </div>
        <nav>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={activeTab === id ? 'nav-button active' : 'nav-button'}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operations Console</p>
            <h1>{tabs.find((tab) => tab.id === activeTab)?.label}</h1>
          </div>
          <button className="icon-button" type="button" onClick={() => loadAll({ clearOnSuccess: true })} title="Refresh data">
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </header>

        {message && (
          <div className={`notice ${message.type}`}>
            <span>{message.text}</span>
            <button type="button" onClick={clearMessage} title="Dismiss">
              <X size={16} />
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard summary={summary} lowStockProducts={lowStockProducts} />
        )}

        {activeTab === 'products' && (
          <Products
            form={productForm}
            editingProductId={editingProductId}
            products={products}
            onChange={updateProductField}
            onSubmit={saveProduct}
            onEdit={editProduct}
            onDelete={deleteProduct}
            onCancel={() => {
              setEditingProductId(null);
              setProductForm(emptyProduct);
            }}
          />
        )}

        {activeTab === 'customers' && (
          <Customers
            form={customerForm}
            customers={customers}
            onChange={updateCustomerField}
            onSubmit={createCustomer}
            onDelete={deleteCustomer}
          />
        )}

        {activeTab === 'orders' && (
          <Orders
            customers={customers}
            products={products}
            orders={orders}
            form={orderForm}
            items={orderItems}
            selectedOrder={selectedOrder}
            onFormChange={(field, value) => setOrderForm((current) => ({ ...current, [field]: value }))}
            onAddItem={addOrderItem}
            onRemoveItem={(productId) =>
              setOrderItems((current) => current.filter((item) => item.product_id !== productId))
            }
            onCreateOrder={createOrder}
            onOpenOrder={openOrder}
            onDeleteOrder={deleteOrder}
            onCloseOrder={() => setSelectedOrder(null)}
          />
        )}
      </main>
    </div>
  );
}

function Dashboard({ summary, lowStockProducts }) {
  const metrics = [
    { label: 'Products', value: summary?.total_products ?? 0, icon: Package },
    { label: 'Customers', value: summary?.total_customers ?? 0, icon: Users },
    { label: 'Orders', value: summary?.total_orders ?? 0, icon: ShoppingCart },
    { label: 'Low Stock', value: summary?.low_stock_products ?? 0, icon: AlertTriangle },
  ];

  return (
    <section className="page-grid">
      <div className="metric-grid">
        {metrics.map(({ label, value, icon: Icon }) => (
          <article className="metric" key={label}>
            <Icon size={21} />
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <div className="panel">
        <div className="panel-heading">
          <h2>Low Stock Products</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.length === 0 ? (
                <tr>
                  <td colSpan="3" className="empty">No low stock products.</td>
                </tr>
              ) : (
                lowStockProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{product.quantity_in_stock}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Products({ form, editingProductId, products, onChange, onSubmit, onEdit, onDelete, onCancel }) {
  return (
    <section className="split">
      <form className="panel form-panel" onSubmit={onSubmit}>
        <div className="panel-heading">
          <h2>{editingProductId ? 'Update Product' : 'Add Product'}</h2>
        </div>
        <label>
          Product name
          <input value={form.name} onChange={(event) => onChange('name', event.target.value)} required />
        </label>
        <label>
          SKU/code
          <input value={form.sku} onChange={(event) => onChange('sku', event.target.value)} required />
        </label>
        <label>
          Price
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(event) => onChange('price', event.target.value)}
            required
          />
        </label>
        <label>
          Quantity in stock
          <input
            type="number"
            min="0"
            value={form.quantity_in_stock}
            onChange={(event) => onChange('quantity_in_stock', event.target.value)}
            required
          />
        </label>
        <div className="button-row">
          <button type="submit" className="primary">
            {editingProductId ? <Save size={17} /> : <Plus size={17} />}
            <span>{editingProductId ? 'Save' : 'Add'}</span>
          </button>
          {editingProductId && (
            <button type="button" onClick={onCancel} className="secondary">
              <X size={17} />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </form>

      <ProductTable products={products} onEdit={onEdit} onDelete={onDelete} />
    </section>
  );
}

function ProductTable({ products, onEdit, onDelete }) {
  return (
    <div className="panel table-panel">
      <div className="panel-heading">
        <h2>Product List</h2>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty">No products found.</td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.sku}</td>
                  <td>${Number(product.price).toFixed(2)}</td>
                  <td>{product.quantity_in_stock}</td>
                  <td className="actions">
                    <button type="button" title="Edit product" onClick={() => onEdit(product)}>
                      <Pencil size={16} />
                    </button>
                    <button type="button" title="Delete product" onClick={() => onDelete(product.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Customers({ form, customers, onChange, onSubmit, onDelete }) {
  return (
    <section className="split">
      <form className="panel form-panel" onSubmit={onSubmit}>
        <div className="panel-heading">
          <h2>Add Customer</h2>
        </div>
        <label>
          Full name
          <input value={form.full_name} onChange={(event) => onChange('full_name', event.target.value)} required />
        </label>
        <label>
          Email address
          <input
            type="email"
            value={form.email}
            onChange={(event) => onChange('email', event.target.value)}
            required
          />
        </label>
        <label>
          Phone number
          <input
            value={form.phone_number}
            onChange={(event) => onChange('phone_number', event.target.value)}
            minLength="5"
            required
          />
        </label>
        <button type="submit" className="primary">
          <Plus size={17} />
          <span>Add</span>
        </button>
      </form>

      <div className="panel table-panel">
        <div className="panel-heading">
          <h2>Customer List</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty">No customers found.</td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.full_name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone_number}</td>
                    <td className="actions">
                      <button type="button" title="Delete customer" onClick={() => onDelete(customer.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Orders({
  customers,
  products,
  orders,
  form,
  items,
  selectedOrder,
  onFormChange,
  onAddItem,
  onRemoveItem,
  onCreateOrder,
  onOpenOrder,
  onDeleteOrder,
  onCloseOrder,
}) {
  return (
    <section className="orders-layout">
      <form className="panel form-panel" onSubmit={onCreateOrder}>
        <div className="panel-heading">
          <h2>Create Order</h2>
        </div>
        <label>
          Customer
          <select value={form.customer_id} onChange={(event) => onFormChange('customer_id', event.target.value)} required>
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.full_name}</option>
            ))}
          </select>
        </label>
        <div className="item-builder">
          <label>
            Product
            <select value={form.product_id} onChange={(event) => onFormChange('product_id', event.target.value)}>
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.quantity_in_stock})
                </option>
              ))}
            </select>
          </label>
          <label>
            Qty
            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(event) => onFormChange('quantity', event.target.value)}
            />
          </label>
          <button type="button" className="secondary add-line" onClick={onAddItem}>
            <Plus size={17} />
            <span>Add</span>
          </button>
        </div>
        <div className="line-items">
          {items.map((item) => (
            <div className="line-item" key={item.product_id}>
              <span>{item.product_name}</span>
              <strong>{item.quantity}</strong>
              <button type="button" title="Remove item" onClick={() => onRemoveItem(item.product_id)}>
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
        <button type="submit" className="primary">
          <ShoppingCart size={17} />
          <span>Create</span>
        </button>
      </form>

      <div className="panel table-panel">
        <div className="panel-heading">
          <h2>Orders</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty">No orders found.</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.customer_name}</td>
                    <td>${Number(order.total_amount).toFixed(2)}</td>
                    <td className="actions">
                      <button type="button" title="View order" onClick={() => onOpenOrder(order.id)}>
                        <Eye size={16} />
                      </button>
                      <button type="button" title="Delete order" onClick={() => onDeleteOrder(order.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="drawer">
          <div className="drawer-header">
            <div>
              <p className="eyebrow">Order #{selectedOrder.id}</p>
              <h2>{selectedOrder.customer_name}</h2>
            </div>
            <button type="button" title="Close details" onClick={onCloseOrder}>
              <X size={18} />
            </button>
          </div>
          <div className="detail-list">
            {selectedOrder.items.map((item) => (
              <div key={item.id} className="detail-line">
                <span>{item.product_name}</span>
                <span>{item.quantity} x ${Number(item.unit_price).toFixed(2)}</span>
                <strong>${Number(item.line_total).toFixed(2)}</strong>
              </div>
            ))}
          </div>
          <div className="total-line">
            <span>Total</span>
            <strong>${Number(selectedOrder.total_amount).toFixed(2)}</strong>
          </div>
        </div>
      )}
    </section>
  );
}

export default App;
