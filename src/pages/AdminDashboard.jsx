import React, { useState, useEffect } from 'react';
import { formatDate, formatCurrency } from '../utils/formatters';
import {
  UtensilsCrossed,
  FolderTree,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Target,
  Calendar,
  Store,
  MapPin,
  RefreshCw,
  Trophy,
  ChefHat,
  Sparkles,
  Users,
  Check,
  X
} from 'lucide-react';
import Modal from '../components/shared/Modal';

export default function AdminDashboard({
  products = [],
  categories = [],
  settings = {},
  ordersData = null,
  onNavigateTab,
  onOpenCreateProduct,
  onOpenCreateCategory,
  onRefreshOrders,
  onCreateManualOrder
}) {
  const [isManualSaleOpen, setIsManualSaleOpen] = useState(false);
  const [manualClient, setManualClient] = useState('');
  const [manualType, setManualType] = useState('dineIn');
  const [manualTableOrAddress, setManualTableOrAddress] = useState('');
  const [manualSelectedProduct, setManualSelectedProduct] = useState('');
  const [manualQuantity, setManualQuantity] = useState(1);
  const [manualAmount, setManualAmount] = useState('');
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [saleSuccessToast, setSaleSuccessToast] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Extract metrics from ordersData
  const metrics = ordersData?.metrics || {
    totalSales: 0,
    totalOrders: 0,
    averageTicket: 0,
    todaySales: 0,
    todayOrdersCount: 0,
    salesByMethod: {
      dineIn: { count: 0, total: 0, label: 'En Mesa' },
      takeout: { count: 0, total: 0, label: 'Para Llevar' },
      delivery: { count: 0, total: 0, label: 'A Domicilio' }
    },
    topProducts: []
  };

  const recentOrders = ordersData?.recentOrders || [];

  const currency = settings?.currency || 'MXN';
  const totalProducts = products.length;
  const totalCategories = categories.length;
  const availableCount = products.filter((p) => p.available !== false).length;
  const soldOutCount = products.filter((p) => p.available === false).length;
  const withPhotoCount = products.filter((p) => p.imageId || p.imageUrl).length;
  const lastUpdated = settings?.updatedAt || products[0]?.updatedAt;

  // Manual sale helper: auto-fill price when selecting a product
  const handleProductSelect = (prodId) => {
    setManualSelectedProduct(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setManualAmount(String(prod.price * manualQuantity));
    }
  };

  const handleQuantityChange = (newQty) => {
    const qty = Math.max(1, parseInt(newQty, 10) || 1);
    setManualQuantity(qty);
    const prod = products.find(p => p.id === manualSelectedProduct);
    if (prod) {
      setManualAmount(String(prod.price * qty));
    }
  };

  // Submit manual sale
  const handleSubmitManualSale = async (e) => {
    e.preventDefault();
    const finalAmount = parseFloat(manualAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      alert('Ingresa un monto de venta válido.');
      return;
    }

    const prod = products.find(p => p.id === manualSelectedProduct);
    const orderPayload = {
      customerName: manualClient.trim() || 'Cliente mostrador',
      orderType: manualType,
      tableNumber: manualType === 'dineIn' ? manualTableOrAddress.trim() : '',
      deliveryAddress: manualType === 'delivery' ? manualTableOrAddress.trim() : '',
      totalAmount: finalAmount,
      items: prod
        ? [{ name: prod.name, price: prod.price, quantity: manualQuantity }]
        : [{ name: 'Venta de mostrador', price: finalAmount, quantity: 1 }]
    };

    setIsSubmittingSale(true);
    try {
      if (onCreateManualOrder) {
        await onCreateManualOrder(orderPayload);
      }
      setSaleSuccessToast(true);
      setTimeout(() => {
        setSaleSuccessToast(false);
        setIsManualSaleOpen(false);
        setManualClient('');
        setManualTableOrAddress('');
        setManualSelectedProduct('');
        setManualQuantity(1);
        setManualAmount('');
      }, 700);
    } catch (err) {
      alert(err.message || 'Error al guardar la venta');
    } finally {
      setIsSubmittingSale(false);
    }
  };

  const handleRefresh = async () => {
    if (!onRefreshOrders) return;
    setIsRefreshing(true);
    try {
      await onRefreshOrders();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Calculate highest revenue for top product bar scaling
  const maxTopProductQty = Math.max(1, ...(metrics.topProducts?.map(p => p.quantity) || [1]));

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Welcome & Actions Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 p-6 sm:p-7 text-white shadow-lg transition-all duration-300 hover:shadow-xl">
        {/* Ambient background glows */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-48 h-48 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-amber-200 mb-2 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Panel Administrativo en Vivo</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm">
              {settings.name || 'Menú Digital'}
            </h1>
            <p className="text-xs sm:text-sm text-orange-100 mt-1 max-w-xl leading-relaxed">
              Monitorea tus ventas en tiempo real, pedidos recibidos por WhatsApp y gestiona el menú desde cualquier dispositivo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
            <button
              type="button"
              onClick={() => setIsManualSaleOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-orange-700 text-xs font-black shadow-md hover:bg-orange-50 active:scale-95 transition-all"
            >
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Registrar Venta</span>
            </button>

            <button
              type="button"
              onClick={onOpenCreateProduct}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-orange-800/60 hover:bg-orange-800 text-white text-xs font-bold border border-white/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Platillo</span>
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 active:scale-95 transition-all"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN 1: MÉTRICAS DE VENTAS (LO QUE SOLICITÓ EL USUARIO) --- */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
              Métricas de Ventas & Rendimiento
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-stone-500">
            Sincronizado con Netlify Blobs
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Total Vendido */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Ventas Totales
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight block">
                {formatCurrency(metrics.totalSales, currency)}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 mt-1 inline-flex items-center gap-1">
                <span>✓ {metrics.totalOrders} pedidos acumulados</span>
              </span>
            </div>
          </div>

          {/* 2. Total de Pedidos */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Pedidos Totales
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight block">
                {metrics.totalOrders}
              </span>
              <span className="text-[11px] font-semibold text-stone-500 mt-1 block">
                Comandas registradas
              </span>
            </div>
          </div>

          {/* 3. Ticket Promedio */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Ticket Promedio
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight block">
                {formatCurrency(metrics.averageTicket, currency)}
              </span>
              <span className="text-[11px] font-semibold text-stone-500 mt-1 block">
                Gasto promedio por cliente
              </span>
            </div>
          </div>

          {/* 4. Ventas de Hoy */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-orange-200 bg-orange-50/30 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-orange-900 uppercase tracking-wider">
                Ventas de Hoy
              </span>
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-orange-950 tracking-tight block">
                {formatCurrency(metrics.todaySales, currency)}
              </span>
              <span className="text-[11px] font-bold text-orange-700 mt-1 inline-flex items-center gap-1">
                <span>🔥 {metrics.todayOrdersCount} pedidos el día de hoy</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN 2: TOP PLATILLOS & VENTAS POR MODALIDAD --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Platillos Más Vendidos */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-stone-900">
                Platillos Más Vendidos
              </h3>
            </div>
            <span className="text-[11px] text-stone-400 font-semibold">Por unidades</span>
          </div>

          {metrics.topProducts && metrics.topProducts.length > 0 ? (
            <div className="space-y-3">
              {metrics.topProducts.map((p, idx) => {
                const percent = Math.round((p.quantity / maxTopProductQty) * 100);
                return (
                  <div key={p.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center text-[10px] font-black flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-stone-900 truncate">
                          {p.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-black text-stone-900">
                          {p.quantity} {p.quantity === 1 ? 'orden' : 'órdenes'}
                        </span>
                        <span className="text-stone-400">
                          ({formatCurrency(p.revenue, currency)})
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-700"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-stone-400">
              Aún no hay suficientes ventas registradas para generar el ranking.
            </div>
          )}
        </div>

        {/* Desglose por Modalidad */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-orange-600" />
                <h3 className="font-bold text-sm text-stone-900">
                  Ventas por Modalidad de Pedido
                </h3>
              </div>
              <span className="text-[11px] text-stone-400 font-semibold">Mesa / Llevar / Domicilio</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Dine In */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-center space-y-1">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 mx-auto flex items-center justify-center">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-stone-500 block">En Mesa</span>
                <span className="text-base font-black text-stone-900 block">
                  {formatCurrency(metrics.salesByMethod?.dineIn?.total || 0, currency)}
                </span>
                <span className="text-[10px] text-stone-400 block font-semibold">
                  {metrics.salesByMethod?.dineIn?.count || 0} pedidos
                </span>
              </div>

              {/* Takeout */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-center space-y-1">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 mx-auto flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-stone-500 block">Para Llevar</span>
                <span className="text-base font-black text-stone-900 block">
                  {formatCurrency(metrics.salesByMethod?.takeout?.total || 0, currency)}
                </span>
                <span className="text-[10px] text-stone-400 block font-semibold">
                  {metrics.salesByMethod?.takeout?.count || 0} pedidos
                </span>
              </div>

              {/* Delivery */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-center space-y-1">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-stone-500 block">A Domicilio</span>
                <span className="text-base font-black text-stone-900 block">
                  {formatCurrency(metrics.salesByMethod?.delivery?.total || 0, currency)}
                </span>
                <span className="text-[10px] text-stone-400 block font-semibold">
                  {metrics.salesByMethod?.delivery?.count || 0} pedidos
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>¿Recibes pedidos en mostrador?</span>
            <button
              type="button"
              onClick={() => setIsManualSaleOpen(true)}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 underline"
            >
              + Registrar venta manual
            </button>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN 3: HISTORIAL DE PEDIDOS RECIENTES --- */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-orange-600" />
            <h3 className="font-bold text-sm text-stone-900">
              Últimos Pedidos Registrados
            </h3>
          </div>
          <span className="text-[11px] text-stone-400">
            Mostrando {recentOrders.length} más recientes
          </span>
        </div>

        {recentOrders.length > 0 ? (
          <div className="divide-y divide-stone-100 overflow-x-auto">
            {recentOrders.map((ord) => (
              <div key={ord.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-stone-50/50 p-2 rounded-xl transition">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-stone-900">
                      {ord.customerName}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ord.orderType === 'dineIn'
                          ? 'bg-orange-100 text-orange-800'
                          : ord.orderType === 'takeout'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {ord.orderType === 'dineIn'
                        ? `Mesa ${ord.tableNumber || '-'}`
                        : ord.orderType === 'takeout'
                        ? 'Para Llevar'
                        : 'Domicilio'}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {formatDate(ord.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 truncate mt-0.5">
                    {Array.isArray(ord.items)
                      ? ord.items.map(i => `${i.quantity}x ${i.name}`).join(', ')
                      : 'Detalle de comanda'}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                  <span className="text-sm font-black text-stone-900">
                    {formatCurrency(ord.totalAmount, currency)}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Completado
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-stone-400">
            No hay pedidos registrados todavía.
          </div>
        )}
      </div>

      {/* --- SECCIÓN 4: ESTADÍSTICAS DEL CATÁLOGO & ACCESOS RÁPIDOS --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Products */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-500 font-medium block">Total Platillos</span>
            <span className="text-xl font-black text-stone-900">{totalProducts}</span>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-500 font-medium block">Categorías</span>
            <span className="text-xl font-black text-stone-900">{totalCategories}</span>
          </div>
        </div>

        {/* Available */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-500 font-medium block">Disponibles</span>
            <span className="text-xl font-black text-emerald-700">{availableCount}</span>
          </div>
        </div>

        {/* Sold Out */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-stone-500 font-medium block">Agotados</span>
            <span className="text-xl font-black text-rose-700">{soldOutCount}</span>
          </div>
        </div>
      </div>

      {/* MODAL PARA REGISTRAR VENTA MANUAL */}
      {isManualSaleOpen && (
        <Modal
          isOpen={isManualSaleOpen}
          onClose={() => setIsManualSaleOpen(false)}
          title="Registrar Venta Directa / Mostrador"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSubmitManualSale} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Nombre del Cliente o Referencia
              </label>
              <input
                type="text"
                value={manualClient}
                onChange={(e) => setManualClient(e.target.value)}
                placeholder="Ej. Juan Pérez / Mostrador"
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            {/* Modalidad */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Modalidad de la Venta
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'dineIn', label: 'En Mesa' },
                  { id: 'takeout', label: 'Para Llevar' },
                  { id: 'delivery', label: 'Domicilio' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setManualType(type.id)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition ${
                      manualType === type.id
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {manualType === 'dineIn' && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Número o Nombre de Mesa
                </label>
                <input
                  type="text"
                  value={manualTableOrAddress}
                  onChange={(e) => setManualTableOrAddress(e.target.value)}
                  placeholder="Ej. Mesa 4 / Terraza"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}

            {manualType === 'delivery' && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Dirección de Entrega
                </label>
                <input
                  type="text"
                  value={manualTableOrAddress}
                  onChange={(e) => setManualTableOrAddress(e.target.value)}
                  placeholder="Ej. Calle Hidalgo 45"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}

            {/* Platillo (opcional para autollenar precio) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Platillo Vendido (opcional)
              </label>
              <select
                value={manualSelectedProduct}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="">-- Seleccionar platillo o escribir monto manual --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatCurrency(p.price, currency)})
                  </option>
                ))}
              </select>
            </div>

            {manualSelectedProduct && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={manualQuantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}

            {/* Monto Total */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Total de la Venta ({currency})
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-base font-black rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-stone-900"
                required
              />
            </div>

            {/* Botones */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsManualSaleOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmittingSale}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-black text-white bg-orange-600 hover:bg-orange-700 transition shadow-md shadow-orange-600/30 flex items-center justify-center gap-1.5"
              >
                {saleSuccessToast ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Guardado!</span>
                  </>
                ) : (
                  <span>Guardar Venta</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
