import React, { useEffect, useMemo, useState } from "react";
import {
  Routes,
  Route,
  NavLink,
  useNavigate,
  useLocation,
  Link,
  useSearchParams,
} from "react-router-dom";
import {
  Building2,
  LayoutDashboard,
  UsersRound,
  Package,
  ShoppingCart,
  ReceiptText,
  BarChart3,
  UserCircle,
  LogOut,
  Plus,
  Search,
  Trash2,
  Menu,
  ShieldCheck,
  KeyRound,
  Activity,
  Settings,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  FileDown,
  Save,
} from "lucide-react";
import { api } from "./api";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: UsersRound },
  { to: "/products", label: "Products", icon: Package },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  { to: "/invoices", label: "Invoices", icon: ReceiptText },
  { to: "/invoice-search", label: "Search Invoices", icon: Search },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];
const initialStats = {
  customers: 0,
  products: 0,
  orders: 0,
  unpaid_invoices: 0,
  revenue: 0,
};

function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@bms.local"),
    [password, setPassword] = useState("admin123"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await api.post("/auth/login", { email, password });
      localStorage.setItem("bms_access_token", r.data.access_token);
      localStorage.setItem("bms_refresh_token", r.data.refresh_token);
      onLogin();
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">
          <Building2 size={30} />
          <b>BMS</b>
        </div>
        <h1>System Administrator</h1>
        <p>Business Management System</p>
        {error && <div className="error">{error}</div>}
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="primary full" disabled={busy}>
          {busy ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

function Layout({ children, onLogout }) {
  const [open, setOpen] = useState(false),
    [search, setSearch] = useState("");
  const location = useLocation(),
    navigate = useNavigate();
  const current = nav.find((n) => n.to === location.pathname);
  const title =
    current?.label || (location.pathname === "/profile" ? "Profile" : "BMS");
  const submitSearch = (e) => {
    e.preventDefault();
    navigate(
      `/invoice-search${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""}`,
    );
    setOpen(false);
  };
  return (
    <div className="app">
      <aside className={open ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <Building2 size={22} />
          <b>BMS</b>
        </div>
        <div className="section-label">MAIN</div>
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={() => setOpen(false)}
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
        <div className="section-label account">ACCOUNT</div>
        <NavLink to="/profile" onClick={() => setOpen(false)}>
          <UserCircle size={16} />
          <span>Profile</span>
        </NavLink>
        <button className="logout" onClick={onLogout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </aside>
      {open && <div className="overlay" onClick={() => setOpen(false)} />}
      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <div>
            <h2>{title}</h2>
            <span>Business Management System</span>
          </div>
          <form className="top-search" onSubmit={submitSearch}>
            <Search size={15} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices..."
            />
            <button title="Search invoices">Search</button>
          </form>
          <div className="welcome">
            Welcome
            <br />
            <b>System Administrator</b>
          </div>
          <Link className="avatar" to="/profile" title="Profile">
            <UserCircle size={22} />
          </Link>
        </header>
        <div className="content">{children}</div>
        <footer>© 2026 Business Management System</footer>
      </main>
    </div>
  );
}

function ApiError({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="api-error">
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry}>
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}
function Stat({ title, value }) {
  return (
    <div className="stat">
      <span>{title}</span>
      <b>{value}</b>
    </div>
  );
}
function Page({ title, subtitle }) {
  return (
    <>
      <h1>{title}</h1>
      <p className="subtitle">{subtitle}</p>
    </>
  );
}
function FormCard({ title, children }) {
  return (
    <section className="panel">
      <div className="panel-title">{title}</div>
      {children}
    </section>
  );
}
function ListPanel({ children, search, setSearch, placeholder }) {
  return (
    <section className="panel list-panel">
      {setSearch && (
        <div className="search">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
          />
        </div>
      )}
      {children}
    </section>
  );
}

function Dashboard() {
  const navigate = useNavigate(),
    [stats, setStats] = useState(initialStats),
    [error, setError] = useState("");
  const load = () =>
    api
      .get("/dashboard/stats")
      .then((r) => setStats(r.data))
      .catch((e) =>
        setError(e.response?.data?.detail || "Could not load dashboard data."),
      );
  useEffect(() => {
    load();
  }, []);
  const money = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
  return (
    <>
      <Page title="Dashboard" subtitle="Welcome, System Administrator" />
      <ApiError message={error} onRetry={load} />
      <div className="stats">
        <Stat title="Customers" value={stats.customers} />
        <Stat title="Products" value={stats.products} />
        <Stat title="Orders" value={stats.orders} />
        <Stat title="Unpaid Invoices" value={stats.unpaid_invoices} />
      </div>
      <div className="grid2">
        <section className="panel">
          <div className="panel-title">Quick Actions</div>
          <div className="actions">
            <button
              className="primary action"
              onClick={() =>
                navigate("/customers", { state: { focusForm: true } })
              }
            >
              <Plus size={15} /> Add Customer
            </button>
            <button
              className="outline action"
              onClick={() =>
                navigate("/products", { state: { focusForm: true } })
              }
            >
              <Plus size={15} /> Add Product
            </button>
            <button
              className="outline action"
              onClick={() =>
                navigate("/orders", { state: { focusForm: true } })
              }
            >
              <Plus size={15} /> New Order
            </button>
            <button
              className="outline action"
              onClick={() => navigate("/invoice-search")}
            >
              Search Invoice <ArrowRight size={14} />
            </button>
          </div>
        </section>
        <section className="panel">
          <div className="panel-title">Business Overview</div>
          <div className="overview">
            <div>
              <span>Total Revenue</span>
              <b>{money(stats.revenue)}</b>
            </div>
            <div>
              <span>Active Products</span>
              <b>{stats.products}</b>
            </div>
            <div>
              <span>Total Customers</span>
              <b>{stats.customers}</b>
            </div>
          </div>
        </section>
      </div>
      <section className="panel recent">
        <div className="panel-title">System Administrator</div>
        <div className="admin-summary">
          <div className="mini-icon">
            <ShieldCheck size={20} />
          </div>
          <div>
            <b>Administrator access is active</b>
            <p>
              You have full access to the BMS dashboard and business management
              functions.
            </p>
          </div>
          <Link to="/profile" className="outline action-inline">
            View Profile <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </>
  );
}

function Customers() {
  const location = useLocation(),
    [items, setItems] = useState([]),
    [form, setForm] = useState({
      name: "",
      company_name: "",
      email: "",
      phone: "",
      address: "",
      gstin: "",
    }),
    [editing, setEditing] = useState(null),
    [q, setQ] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = () =>
    api
      .get("/customers")
      .then((r) => setItems(r.data))
      .catch((e) =>
        setError(e.response?.data?.detail || "Could not load customers."),
      );
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (location.state?.focusForm)
      window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.state]);
  const reset = () => {
    setEditing(null);
    setForm({
      name: "",
      company_name: "",
      email: "",
      phone: "",
      address: "",
      gstin: "",
    });
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    setError("");
    try {
      if (editing) await api.put(`/customers/${editing}`, form);
      else await api.post("/customers", form);
      reset();
      await load();
    } catch (e) {
      setError(e.response?.data?.detail || "Could not save customer.");
    } finally {
      setBusy(false);
    }
  };
  const del = async (id) => {
    if (!confirm("Delete this customer?")) return;
    try {
      await api.delete(`/customers/${id}`);
      await load();
    } catch (e) {
      setError(e.response?.data?.detail || "Could not delete customer.");
    }
  };
  const filtered = items.filter((x) =>
    (x.name + x.company_name + x.email + x.phone + x.address + x.gstin)
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  return (
    <>
      <Page title="Customers" subtitle="Manage customer records" />
      <ApiError message={error} onRetry={load} />
      <FormCard title={editing ? "Edit Customer" : "Add Customer"}>
        <form className="form-grid" onSubmit={submit}>
          <input
            placeholder="Customer name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            placeholder="Company / Firm name"
            value={form.company_name}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
          />
          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            placeholder="GSTIN"
            value={form.gstin}
            onChange={(e) => setForm({ ...form, gstin: e.target.value })}
          />
          <input
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <button className="primary" disabled={busy}>
            <Plus size={15} />{" "}
            {busy
              ? editing
                ? "Saving..."
                : "Adding..."
              : editing
                ? "Save Changes"
                : "Add"}
          </button>
          {editing && (
            <button type="button" className="outline" onClick={reset}>
              Cancel
            </button>
          )}
        </form>
      </FormCard>
      <ListPanel search={q} setSearch={setQ} placeholder="Search customers">
        <div className="customer-list">
          {filtered.map((x) => (
            <div className="list-row" key={x.id}>
              <div>
                <b>{x.name}</b>
                <small>
                  {x.company_name || ""}
                  {x.company_name && " · "}
                  {x.email || "No email"} · {x.phone || "No phone"}
                </small>
                {x.gstin && <small>GSTIN: {x.gstin}</small>}
              </div>
              <span className="row-actions">
                <button
                  className="small-outline"
                  onClick={() => {
                    setEditing(x.id);
                    setForm({
                      name: x.name,
                      company_name: x.company_name || "",
                      email: x.email || "",
                      phone: x.phone || "",
                      address: x.address || "",
                      gstin: x.gstin || "",
                    });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Edit
                </button>
                <button className="icon-danger" onClick={() => del(x.id)}>
                  <Trash2 size={16} />
                </button>
              </span>
            </div>
          ))}
          {!filtered.length && (
            <div className="empty">
              {items.length
                ? "No customers match your search."
                : "No customers found."}
            </div>
          )}
        </div>
      </ListPanel>
    </>
  );
}
function Products() {
  const [items, setItems] = useState([]),
    [form, setForm] = useState({
      name: "",
      sku: "",
      price: "",
      quantity_in_stock: "",
    }),
    [q, setQ] = useState(""),
    [editing, setEditing] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = () =>
    api
      .get("/products", { params: { q } })
      .then((r) => setItems(r.data))
      .catch((e) =>
        setError(e.response?.data?.detail || "Could not load products."),
      );
  useEffect(() => {
    load();
  }, [q]);
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.sku.trim()) return;
    setBusy(true);
    setError("");
    try {
      const body = {
        ...form,
        price: Number(form.price || 0),
        quantity_in_stock: Number(form.quantity_in_stock || 0),
      };
      if (editing) await api.put(`/products/${editing}`, body);
      else await api.post("/products", body);
      setForm({ name: "", sku: "", price: "", quantity_in_stock: "" });
      setEditing(null);
      await load();
    } catch (e) {
      setError(e.response?.data?.detail || "Could not save product.");
    } finally {
      setBusy(false);
    }
  };
  const del = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      await load();
    } catch (e) {
      setError(e.response?.data?.detail || "Could not delete product.");
    }
  };
  return (
    <>
      <Page title="Products" subtitle="Manage inventory and stock" />
      <ApiError message={error} onRetry={load} />
      <FormCard title={editing ? "Edit Product" : "Add Product"}>
        <form className="form-grid" onSubmit={submit}>
          <input
            placeholder="Product name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            placeholder="SKU *"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
          />
          <input
            type="number"
            min="0"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <input
            type="number"
            min="0"
            placeholder="Quantity"
            value={form.quantity_in_stock}
            onChange={(e) =>
              setForm({ ...form, quantity_in_stock: e.target.value })
            }
          />
          <button className="primary" disabled={busy}>
            <Plus size={15} />{" "}
            {busy
              ? editing
                ? "Saving..."
                : "Adding..."
              : editing
                ? "Save Changes"
                : "Add"}
          </button>
          {editing && (
            <button
              type="button"
              className="outline"
              onClick={() => {
                setEditing(null);
                setForm({
                  name: "",
                  sku: "",
                  price: "",
                  quantity_in_stock: "",
                });
              }}
            >
              Cancel
            </button>
          )}
        </form>
      </FormCard>
      <ListPanel
        search={q}
        setSearch={setQ}
        placeholder="Search product name or SKU"
      >
        <div className="table-head">
          <span>Product</span>
          <span>SKU</span>
          <span>Price</span>
          <span>Stock</span>
          <span>Actions</span>
        </div>
        {items.map((x) => (
          <div className="table-row" key={x.id}>
            <b>{x.name}</b>
            <span>{x.sku}</span>
            <span>₹{Number(x.price).toLocaleString("en-IN")}</span>
            <span>
              <span
                className={
                  x.quantity_in_stock < 5 ? "badge red" : "badge green"
                }
              >
                {x.quantity_in_stock}
              </span>
            </span>
            <span className="row-actions">
              <button
                className="small-outline"
                onClick={() => {
                  setEditing(x.id);
                  setForm({
                    name: x.name,
                    sku: x.sku,
                    price: x.price,
                    quantity_in_stock: x.quantity_in_stock,
                  });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Edit
              </button>
              <button className="icon-danger" onClick={() => del(x.id)}>
                <Trash2 size={16} />
              </button>
            </span>
          </div>
        ))}
        {!items.length && <div className="empty">No products found.</div>}
      </ListPanel>
    </>
  );
}
function Orders() {
  const [orders, setOrders] = useState([]),
    [customers, setCustomers] = useState([]),
    [products, setProducts] = useState([]),
    [form, setForm] = useState({
      customer_id: "",
      items: [{ product_id: "", quantity: 1 }],
    }),
    [q, setQ] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [params] = useSearchParams();
  const orderParam = params.get("order") || "";
  const load = () =>
    api
      .get("/orders")
      .then((r) => setOrders(r.data))
      .catch((e) =>
        setError(e.response?.data?.detail || "Could not load orders."),
      );
  useEffect(() => {
    load();
    api
      .get("/customers")
      .then((r) => setCustomers(r.data))
      .catch(() => {});
    api
      .get("/products")
      .then((r) => setProducts(r.data))
      .catch(() => {});
  }, []);
  const updateItem = (i, key, value) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((row, idx) =>
        idx === i ? { ...row, [key]: value } : row,
      ),
    }));
  const addItem = () =>
    setForm((f) => ({
      ...f,
      items: [...f.items, { product_id: "", quantity: 1 }],
    }));
  const removeItem = (i) =>
    setForm((f) => ({
      ...f,
      items:
        f.items.length === 1 ? f.items : f.items.filter((_, idx) => idx !== i),
    }));
  const add = async (e) => {
    e.preventDefault();
    const items = form.items.filter((x) => x.product_id);
    if (!form.customer_id || !items.length) return;
    setBusy(true);
    setError("");
    try {
      await api.post("/orders", {
        customer_id: Number(form.customer_id),
        items: items.map((x) => ({
          product_id: Number(x.product_id),
          quantity: Number(x.quantity),
        })),
      });
      setForm({ customer_id: "", items: [{ product_id: "", quantity: 1 }] });
      await load();
    } catch (e) {
      setError(e.response?.data?.detail || "Could not create order.");
    } finally {
      setBusy(false);
    }
  };
  const setStatus = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status?status=${status}`);
      await load();
    } catch (e) {
      setError(e.response?.data?.detail || "Could not update order status.");
    }
  };
  const filtered = orders.filter((x) => {
    const customer =
      customers.find((c) => c.id === x.customer_id)?.name ||
      `Customer #${x.customer_id}`;
    const text = `${x.id} ${customer} ${x.status}`.toLowerCase();
    return (
      (!orderParam || String(x.id) === orderParam) &&
      text.includes(q.toLowerCase())
    );
  });
  return (
    <>
      <Page title="Orders" subtitle="Create, track and complete sales orders" />
      <ApiError message={error} onRetry={load} />
      <FormCard title="New Order">
        <form className="order-form" onSubmit={add}>
          <div className="order-customer">
            <select
              value={form.customer_id}
              onChange={(e) =>
                setForm({ ...form, customer_id: e.target.value })
              }
            >
              <option value="">Select customer</option>
              {customers.map((x) => (
                <option value={x.id} key={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </div>
          <div className="order-items">
            <div className="order-items-title">Order Items</div>
            {form.items.map((item, i) => (
              <div className="order-item-editor" key={i}>
                <select
                  value={item.product_id}
                  onChange={(e) => updateItem(i, "product_id", e.target.value)}
                >
                  <option value="">Select product</option>
                  {products.map((x) => (
                    <option
                      value={x.id}
                      key={x.id}
                      disabled={form.items.some(
                        (r, idx) =>
                          idx !== i && String(r.product_id) === String(x.id),
                      )}
                    >
                      {x.name} ({x.quantity_in_stock} stock · ₹
                      {Number(x.price).toLocaleString("en-IN")})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, "quantity", e.target.value)}
                />
                {form.items.length > 1 && (
                  <button
                    type="button"
                    className="icon-danger"
                    onClick={() => removeItem(i)}
                  >
                    <XCircle size={17} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="outline add-item"
              onClick={addItem}
            >
              <Plus size={14} /> Add Item
            </button>
          </div>
          <button className="primary order-submit" disabled={busy}>
            <Plus size={15} /> {busy ? "Creating..." : "Create Order"}
          </button>
        </form>
      </FormCard>
      <ListPanel
        search={q}
        setSearch={setQ}
        placeholder="Search order number, customer or status"
      >
        <div className="table-head order-head">
          <span>ID</span>
          <span>Customer / Items</span>
          <span>Status</span>
          <span>Total</span>
          <span>Invoice / Action</span>
        </div>
        {filtered.map((x) => (
          <div className="table-row order-row" key={x.id}>
            <b>#{x.id}</b>
            <span>
              <b>
                {customers.find((c) => c.id === x.customer_id)?.name ||
                  `Customer #${x.customer_id}`}
              </b>
              <small>{x.items?.length || 0} item(s)</small>
            </span>
            <span
              className={
                x.status === "Paid"
                  ? "badge green"
                  : x.status === "Cancelled"
                    ? "badge red"
                    : "badge yellow"
              }
            >
              {x.status}
            </span>
            <span>₹{Number(x.total_amount).toLocaleString("en-IN")}</span>
            <span className="row-actions">
              <Link
                className="text-link"
                to={`/invoice-search?q=${encodeURIComponent(String(x.id))}`}
              >
                INV-{String(x.id).padStart(5, "0")}
              </Link>
              {x.status === "Pending" && (
                <button
                  className="small-primary"
                  onClick={() => setStatus(x.id, "Paid")}
                >
                  <CheckCircle2 size={14} /> Mark Paid
                </button>
              )}
              {x.status === "Paid" && (
                <button
                  className="small-outline"
                  onClick={() => setStatus(x.id, "Pending")}
                >
                  <XCircle size={14} /> Mark Unpaid
                </button>
              )}
              {x.status !== "Cancelled" && (
                <button
                  className="small-outline"
                  onClick={() => setStatus(x.id, "Cancelled")}
                >
                  Cancel
                </button>
              )}
            </span>
          </div>
        ))}
        {!filtered.length && <div className="empty">No matching orders.</div>}
      </ListPanel>
    </>
  );
}
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/\'/g, "&#39;");
}
async function downloadReceipt(invoice) {
  try {
    const [firmRes] = await Promise.all([api.get("/firm")]);
    const firm = firmRes.data || {};
    const address = [
      firm.address_line1,
      firm.address_line2,
      firm.city,
      firm.state,
      firm.pin_code,
    ]
      .filter(Boolean)
      .join(", ");
    const rows = (invoice.items || [])
      .map(
        (i) =>
          `<tr><td>${escapeHtml(i.product_name)}</td><td>${i.quantity}</td><td>₹${Number(i.unit_price).toLocaleString("en-IN")}</td><td>₹${Number(i.line_total).toLocaleString("en-IN")}</td></tr>`,
      )
      .join("");
    const receiverAddress = escapeHtml(invoice.customer_address || "").replace(
      /\n/g,
      "<br>",
    );
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(invoice.invoice_number)} Receipt</title><style>@page{size:A4;margin:18mm}body{font-family:Arial,sans-serif;color:#202a35;margin:0}.sheet{max-width:780px;margin:0 auto}.header{border-bottom:2px solid #1f6feb;padding-bottom:16px;display:flex;justify-content:space-between;gap:30px}.firm h1{margin:0 0 5px;font-size:24px}.muted{color:#667789;font-size:12px;line-height:1.55}.right{text-align:right}.title{text-align:center;margin:22px 0 16px;font-size:19px;font-weight:700;letter-spacing:.5px}.box{border:1px solid #d9e0e7;border-radius:6px;padding:14px;margin-bottom:16px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}.label{font-size:10px;text-transform:uppercase;color:#78899a;font-weight:700;margin-bottom:5px}.value{font-size:13px;line-height:1.55}.meta{display:grid;grid-template-columns:1fr 1fr;gap:7px;font-size:12px}.meta b{display:inline-block;min-width:85px}.status{display:inline-block;margin-top:10px;padding:5px 10px;border:1px solid #aab6c2;border-radius:4px;font-size:11px;font-weight:700}table{width:100%;border-collapse:collapse;margin-top:8px}th{background:#f3f6f9;font-size:11px;text-transform:uppercase;color:#536679}th,td{padding:10px;border-bottom:1px solid #e2e7ec;text-align:left}th:nth-child(n+2),td:nth-child(n+2){text-align:right}.summary{margin-left:auto;width:300px;margin-top:15px}.sum{display:flex;justify-content:space-between;padding:5px 0;font-size:13px}.grand{border-top:2px solid #202a35;margin-top:5px;padding-top:9px;font-size:17px;font-weight:700}.footer{border-top:1px solid #d9e0e7;margin-top:30px;padding-top:14px;display:flex;justify-content:space-between;gap:30px;font-size:11px;color:#667789}.sign{text-align:right;color:#34495e}.thank{text-align:center;margin-top:20px;font-size:12px;color:#536679}@media print{.sheet{max-width:none}} </style></head><body><div class="sheet"><div class="header"><div class="firm"><h1>${escapeHtml(firm.firm_name || "Your Firm Name")}</h1>${firm.legal_name && `<div class="muted">${escapeHtml(firm.legal_name)}</div>`}<div class="muted">${escapeHtml(address)}</div>${firm.gstin ? `<div class="muted"><b>GSTIN:</b> ${escapeHtml(firm.gstin)}</div>` : ""}${firm.pan ? `<div class="muted"><b>PAN:</b> ${escapeHtml(firm.pan)}</div>` : ""}</div><div class="right muted">${firm.phone ? `<div>${escapeHtml(firm.phone)}</div>` : ""}${firm.email ? `<div>${escapeHtml(firm.email)}</div>` : ""}${firm.website ? `<div>${escapeHtml(firm.website)}</div>` : ""}</div></div><div class="title">TAX INVOICE / PAYMENT RECEIPT</div><div class="box"><div class="meta"><div><b>Invoice No:</b> ${escapeHtml(invoice.invoice_number)}</div><div><b>Order No:</b> #${invoice.order_id}</div><div><b>Issue Date:</b> ${new Date(invoice.issued_at).toLocaleDateString("en-IN")}</div><div><b>Payment:</b> ${escapeHtml(invoice.status)}</div></div></div><div class="box grid"><div><div class="label">Bill To / Receiver</div><div class="value"><b>${escapeHtml(invoice.customer_name)}</b>${invoice.customer_company ? `<br>${escapeHtml(invoice.customer_company)}` : ""}${invoice.customer_address ? `<br>${receiverAddress}` : ""}${invoice.customer_phone ? `<br>Phone: ${escapeHtml(invoice.customer_phone)}` : ""}${invoice.customer_email ? `<br>Email: ${escapeHtml(invoice.customer_email)}` : ""}${invoice.customer_gstin ? `<br>GSTIN: ${escapeHtml(invoice.customer_gstin)}` : ""}</div></div><div><div class="label">Issuer</div><div class="value"><b>${escapeHtml(firm.firm_name || "Your Firm Name")}</b>${firm.business_type ? `<br>${escapeHtml(firm.business_type)}` : ""}${firm.gst_registration_type ? `<br>GST Type: ${escapeHtml(firm.gst_registration_type)}` : ""}${firm.registration_no ? `<br>Registration No: ${escapeHtml(firm.registration_no)}` : ""}</div></div></div><div class="box"><div class="label">Items</div><table><thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><div class="summary"><div class="sum"><span>Subtotal</span><b>₹${Number(invoice.order_total || 0).toLocaleString("en-IN")}</b></div><div class="sum"><span>Tax</span><b>₹0</b></div><div class="sum grand"><span>Total</span><span>₹${Number(invoice.order_total || 0).toLocaleString("en-IN")}</span></div></div></div><div class="footer"><div><b>Legal / Tax Information</b><br>${firm.gstin ? `GSTIN: ${escapeHtml(firm.gstin)}<br>` : ""}${firm.pan ? `PAN: ${escapeHtml(firm.pan)}<br>` : ""}${firm.registration_no ? `Registration No: ${escapeHtml(firm.registration_no)}<br>` : ""}${escapeHtml(firm.gst_registration_type || "")}</div><div class="sign">For <b>${escapeHtml(firm.firm_name || "Your Firm Name")}</b><br><br>Authorized Signatory</div></div><div class="thank">Thank you for your business.</div></div></body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.invoice_number}-receipt.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    alert(e.response?.data?.detail || "Could not generate receipt.");
  }
}
function InvoiceTable({ items, onStatus }) {
  return (
    <>
      <div className="table-head invoice-head">
        <span>Invoice</span>
        <span>Order / Customer</span>
        <span>Status</span>
        <span>Issued</span>
        <span>Actions</span>
      </div>
      {items.map((x) => (
        <div className="table-row invoice-row" key={x.id}>
          <div>
            <b>{x.invoice_number}</b>
            <small>{x.customer_name}</small>
          </div>
          <div>
            <Link className="text-link" to={`/orders?order=${x.order_id}`}>
              Order #{x.order_id}
            </Link>
            <small>
              {x.items?.length || 0} item(s) · ₹
              {Number(x.order_total || 0).toLocaleString("en-IN")}
            </small>
          </div>
          <span
            className={
              x.status === "Paid"
                ? "badge green"
                : x.status === "Cancelled"
                  ? "badge red"
                  : "badge yellow"
            }
          >
            {x.status}
          </span>
          <span>{new Date(x.issued_at).toLocaleDateString()}</span>
          <span className="row-actions">
            {x.status === "Paid" && (
              <button
                className="small-outline"
                onClick={() => onStatus(x.id, "Unpaid")}
              >
                <XCircle size={14} /> Mark Unpaid
              </button>
            )}
            {x.status === "Unpaid" && (
              <button
                className="small-primary"
                onClick={() => onStatus(x.id, "Paid")}
              >
                <CheckCircle2 size={14} /> Mark Paid
              </button>
            )}
            <button
              className="small-outline"
              onClick={() => downloadReceipt(x)}
            >
              <FileDown size={14} /> Receipt
            </button>
          </span>
        </div>
      ))}
    </>
  );
}
function Invoices() {
  const [items, setItems] = useState([]),
    [error, setError] = useState(""),
    [q, setQ] = useState("");
  const load = () =>
    api
      .get("/invoices", { params: { q } })
      .then((r) => setItems(r.data))
      .catch((e) =>
        setError(e.response?.data?.detail || "Could not load invoices."),
      );
  useEffect(() => {
    load();
  }, [q]);
  const setStatus = async (id, status) => {
    try {
      await api.patch(`/invoices/${id}/status?status=${status}`);
      await load();
    } catch (e) {
      setError(e.response?.data?.detail || "Could not update invoice status.");
    }
  };
  return (
    <>
      <Page
        title="Invoices"
        subtitle="Track payments and trace every invoice back to its order"
      />
      <ApiError message={error} onRetry={load} />
      <ListPanel
        search={q}
        setSearch={setQ}
        placeholder="Search invoice number, order ID or customer"
      >
        <InvoiceTable items={items} onStatus={setStatus} />
        {!items.length && (
          <div className="empty">
            {q
              ? "No invoices match your search."
              : "No invoices yet. Invoices are created automatically when an order is placed."}
          </div>
        )}
      </ListPanel>
    </>
  );
}

function InvoiceSearch() {
  const [params, setParams] = useSearchParams(),
    initial = params.get("q") || "",
    [q, setQ] = useState(initial),
    [items, setItems] = useState([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const search = async (value) => {
    setBusy(true);
    setError("");
    try {
      const r = await api.get("/invoices", { params: { q: value } });
      setItems(r.data);
      setParams(value ? { q: value } : {});
    } catch (e) {
      setError(e.response?.data?.detail || "Could not search invoices.");
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    search(initial);
  }, []);
  const submit = (e) => {
    e.preventDefault();
    search(q);
  };
  const setStatus = async (id, status) => {
    try {
      await api.patch(`/invoices/${id}/status?status=${status}`);
      await search(q);
    } catch (e) {
      setError(e.response?.data?.detail || "Could not update invoice status.");
    }
  };
  return (
    <>
      <Page
        title="Search Invoices"
        subtitle="Find an invoice by invoice number, order number or customer name"
      />
      <section className="panel search-panel">
        <form className="invoice-search-form" onSubmit={submit}>
          <Search size={18} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. INV-00001, 1 or customer name"
          />
          <button className="primary" disabled={busy}>
            {busy ? "Searching..." : "Search"}
          </button>
          {q && (
            <button
              type="button"
              className="outline"
              onClick={() => {
                setQ("");
                search("");
              }}
            >
              Clear
            </button>
          )}
        </form>
      </section>
      <ApiError message={error} onRetry={() => search(q)} />
      <ListPanel>
        <InvoiceTable items={items} onStatus={setStatus} />
        {!items.length && <div className="empty">No matching invoices.</div>}
      </ListPanel>
    </>
  );
}

function Reports() {
  const [s, setS] = useState(initialStats),
    [error, setError] = useState("");
  const load = () =>
    api
      .get("/dashboard/stats")
      .then((r) => setS(r.data))
      .catch((e) =>
        setError(e.response?.data?.detail || "Could not load report data."),
      );
  useEffect(() => {
    load();
  }, []);
  return (
    <>
      <Page title="Reports" subtitle="Business overview and key metrics" />
      <ApiError message={error} onRetry={load} />
      <div className="stats">
        <Stat
          title="Revenue"
          value={"₹" + Number(s.revenue || 0).toLocaleString("en-IN")}
        />
        <Stat title="Customers" value={s.customers} />
        <Stat title="Products" value={s.products} />
        <Stat title="Orders" value={s.orders} />
      </div>
      <section className="panel">
        <div className="panel-title">Report Summary</div>
        <div className="report-line">
          <span>Unpaid invoices</span>
          <b>{s.unpaid_invoices}</b>
        </div>
        <div className="report-line">
          <span>Total registered customers</span>
          <b>{s.customers}</b>
        </div>
        <div className="report-line">
          <span>Products in inventory</span>
          <b>{s.products}</b>
        </div>
      </section>
    </>
  );
}

function Profile() {
  const blank = {
    firm_name: "",
    legal_name: "",
    business_type: "",
    gstin: "",
    pan: "",
    registration_no: "",
    gst_registration_type: "",
    phone: "",
    email: "",
    website: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    state_code: "",
    pin_code: "",
    country: "India",
  };
  const [form, setForm] = useState(blank),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  const load = () =>
    api
      .get("/firm")
      .then((r) => setForm({ ...blank, ...r.data }))
      .catch((e) =>
        setError(
          e.response?.data?.detail || "Could not load firm information.",
        ),
      );
  useEffect(() => {
    load();
  }, []);
  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const save = async (e) => {
    e.preventDefault();
    if (!form.firm_name.trim()) {
      setError("Firm name is required.");
      return;
    }
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await api.put("/firm", form);
      setSaved(true);
    } catch (e) {
      setError(e.response?.data?.detail || "Could not save firm information.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Page
        title="Profile"
        subtitle="System Administrator and firm information"
      />
      <ApiError message={error} onRetry={load} />
      <div className="profile-grid">
        <section className="panel profile-card">
          <div className="profile-avatar">
            <UserCircle size={70} />
          </div>
          <h2>System Administrator</h2>
          <p>
            Primary administrator account for the Business Management System.
          </p>
          <div className="profile-status">
            <span className="status-dot"></span> Account active
          </div>
        </section>
        <section className="panel profile-details">
          <div className="panel-title">Account Information</div>
          <div className="detail-row">
            <span>Email</span>
            <b>admin@bms.local</b>
          </div>
          <div className="detail-row">
            <span>Account type</span>
            <b>System Administrator</b>
          </div>
          <div className="detail-row">
            <span>Access level</span>
            <b>Full system access</b>
          </div>
          <div className="detail-row">
            <span>Authentication</span>
            <b>JWT protected</b>
          </div>
        </section>
      </div>
      <section className="panel firm-profile">
        <div className="panel-title">Firm / Business Information</div>
        <p className="form-note">
          This information appears on generated receipts and invoices.
        </p>
        <form className="form-grid" onSubmit={save}>
          <input
            required
            placeholder="Firm name *"
            value={form.firm_name}
            onChange={(e) => update("firm_name", e.target.value)}
          />
          <input
            placeholder="Legal name"
            value={form.legal_name}
            onChange={(e) => update("legal_name", e.target.value)}
          />
          <input
            placeholder="Business type"
            value={form.business_type}
            onChange={(e) => update("business_type", e.target.value)}
          />
          <input
            placeholder="GSTIN"
            value={form.gstin}
            onChange={(e) => update("gstin", e.target.value)}
          />
          <input
            placeholder="PAN"
            value={form.pan}
            onChange={(e) => update("pan", e.target.value)}
          />
          <input
            placeholder="Registration / License No."
            value={form.registration_no}
            onChange={(e) => update("registration_no", e.target.value)}
          />
          <input
            placeholder="GST registration type"
            value={form.gst_registration_type}
            onChange={(e) => update("gst_registration_type", e.target.value)}
          />
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
          <input
            placeholder="Business email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
          <input
            placeholder="Website"
            value={form.website}
            onChange={(e) => update("website", e.target.value)}
          />
          <input
            placeholder="Address line 1"
            value={form.address_line1}
            onChange={(e) => update("address_line1", e.target.value)}
          />
          <input
            placeholder="Address line 2"
            value={form.address_line2}
            onChange={(e) => update("address_line2", e.target.value)}
          />
          <input
            placeholder="City"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
          />
          <input
            placeholder="State"
            value={form.state}
            onChange={(e) => update("state", e.target.value)}
          />
          <input
            placeholder="State code"
            value={form.state_code}
            onChange={(e) => update("state_code", e.target.value)}
          />
          <input
            placeholder="PIN code"
            value={form.pin_code}
            onChange={(e) => update("pin_code", e.target.value)}
          />
          <input
            placeholder="Country"
            value={form.country}
            onChange={(e) => update("country", e.target.value)}
          />
          <div className="form-actions">
            <button className="primary" disabled={busy}>
              <Save size={15} /> {busy ? "Saving..." : "Save Firm Information"}
            </button>
            {saved && <span className="save-success">Saved successfully</span>}
          </div>
        </form>
      </section>
      <div className="profile-grid">
        <section className="panel">
          <div className="panel-title">Security</div>
          <div className="feature-row">
            <KeyRound size={19} />
            <div>
              <b>Password protected</b>
              <small>
                Administrator credentials are stored as a secure hash.
              </small>
            </div>
          </div>
          <div className="feature-row">
            <ShieldCheck size={19} />
            <div>
              <b>Protected routes</b>
              <small>Business pages require an authenticated session.</small>
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-title">System Access</div>
          <div className="feature-row">
            <Activity size={19} />
            <div>
              <b>Dashboard & reports</b>
              <small>View business metrics and system information.</small>
            </div>
          </div>
          <div className="feature-row">
            <Settings size={19} />
            <div>
              <b>Administrator control</b>
              <small>Manage customers, products, orders and invoices.</small>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
function NotFound() {
  return (
    <div className="not-found">
      <div className="mini-icon">
        <Settings size={22} />
      </div>
      <h2>Page not found</h2>
      <p>The requested BMS page does not exist.</p>
      <Link className="primary" to="/">
        Back to Dashboard
      </Link>
    </div>
  );
}

export default function App() {
  const [auth, setAuth] = useState(!!localStorage.getItem("bms_access_token")),
    navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem("bms_access_token");
    localStorage.removeItem("bms_refresh_token");
    setAuth(false);
    navigate("/");
  };
  if (!auth)
    return (
      <Login
        onLogin={() => {
          setAuth(true);
          navigate("/");
        }}
      />
    );
  return (
    <Layout onLogout={logout}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/products" element={<Products />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/invoice-search" element={<InvoiceSearch />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
