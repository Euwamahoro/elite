import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingBag, AlertTriangle, Download } from 'lucide-react';
import { BossDashboardMetrics } from '../types/models';
import { getBossDashboardMetrics } from '../api/apiService';
import Layout from '../components/Layout';

// ─── Pagination hook ───────────────────────────────────────────────────────────
function usePagination<T>(data: T[], pageSize = 5) {
    const [page, setPage] = useState(1);
    const totalPages = Math.ceil(data.length / pageSize);
    const paginated = data.slice((page - 1) * pageSize, page * pageSize);
    const reset = () => setPage(1);
    return { page, setPage, totalPages, paginated, reset };
}

// ─── Pagination bar ────────────────────────────────────────────────────────────
function Pagination({
    page,
    totalPages,
    total,
    pageSize,
    onPage,
}: {
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
    onPage: (p: number) => void;
}) {
    if (totalPages <= 1) return null;
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    // Show at most 5 page number buttons centred around current page
    const getPages = () => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const start = Math.max(1, Math.min(page - 2, totalPages - 4));
        return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
    };

    const btnBase: React.CSSProperties = {
        padding: '4px 10px',
        border: '1px solid var(--border)',
        borderRadius: 6,
        background: 'var(--background)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        fontSize: 12,
        lineHeight: '18px',
    };
    const btnDisabled: React.CSSProperties = {
        ...btnBase,
        background: 'var(--background-secondary)',
        color: 'var(--text-muted)',
        cursor: 'not-allowed',
    };
    const btnActive: React.CSSProperties = {
        ...btnBase,
        background: '#185FA5',
        color: '#E6F1FB',
        borderColor: '#185FA5',
        fontWeight: 600,
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 20px',
            borderTop: '1px solid var(--border)',
            flexWrap: 'wrap',
            gap: 8,
        }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Showing {from}–{to} of {total}
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button
                    onClick={() => onPage(page - 1)}
                    disabled={page === 1}
                    style={page === 1 ? btnDisabled : btnBase}
                >← Prev</button>

                {getPages()[0] > 1 && (
                    <>
                        <button onClick={() => onPage(1)} style={btnBase}>1</button>
                        {getPages()[0] > 2 && <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '0 2px' }}>…</span>}
                    </>
                )}

                {getPages().map(p => (
                    <button key={p} onClick={() => onPage(p)} style={p === page ? btnActive : btnBase}>{p}</button>
                ))}

                {getPages()[getPages().length - 1] < totalPages && (
                    <>
                        {getPages()[getPages().length - 1] < totalPages - 1 && (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '0 2px' }}>…</span>
                        )}
                        <button onClick={() => onPage(totalPages)} style={btnBase}>{totalPages}</button>
                    </>
                )}

                <button
                    onClick={() => onPage(page + 1)}
                    disabled={page === totalPages}
                    style={page === totalPages ? btnDisabled : btnBase}
                >Next →</button>
            </div>
        </div>
    );
}

// ─── Shared table header cell style ───────────────────────────────────────────
const thStyle: React.CSSProperties = {
    padding: '10px 20px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: 'var(--text-secondary)',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
    background: 'var(--background-secondary)',
};

// ─── Panel wrapper ─────────────────────────────────────────────────────────────
function Panel({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--border-radius)',
            overflow: 'hidden',
        }}>
            {children}
        </div>
    );
}

function PanelHead({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
        }}>
            {children}
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────
const DashboardBoss = () => {
    const [metrics, setMetrics] = useState<BossDashboardMetrics | null>(null);
    const [period, setPeriod] = useState('month');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchMetrics();
    }, [period]);

    const fetchMetrics = async () => {
        try {
            setLoading(true);
            const response = await getBossDashboardMetrics(period);
            setMetrics(response.data);
            setError(null);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to fetch dashboard metrics');
            console.error('Dashboard fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportDashboard = () => {
        if (!metrics) return;

        let csv = `Elite Movers Dashboard Report\n`;
        csv += `Period: ${period}\n`;
        csv += `Generated: ${new Date().toLocaleString()}\n\n`;

        csv += `ALL TIME FINANCIALS\n`;
        csv += `Total Revenue,${metrics.financials.allTime.totalRevenue}\n`;
        csv += `Total Expenses,${metrics.financials.allTime.totalExpenses}\n`;
        csv += `Total Purchases,${metrics.financials.allTime.totalPurchases}\n`;
        csv += `Net Profit,${metrics.financials.allTime.netProfit}\n\n`;

        csv += `PERIOD FINANCIALS (${period.toUpperCase()})\n`;
        csv += `Revenue,${metrics.financials.period.totalRevenue}\n`;
        csv += `Expenses,${metrics.financials.period.totalExpenses}\n`;
        csv += `Purchases,${metrics.financials.period.totalPurchases}\n`;
        csv += `Net Profit,${metrics.financials.period.netProfit}\n\n`;

        csv += `INVENTORY\n`;
        csv += `Total Products,${metrics.inventory.totalProducts}\n`;
        csv += `Total Stock,${metrics.inventory.totalQuantityInStock}\n\n`;

        csv += `LOW STOCK ITEMS\n`;
        csv += `Product,Code,Current Stock,Min Level\n`;
        metrics.inventory.lowStockItems.forEach(item => {
            csv += `${item.name},${item.productCode},${item.totalStock},${item.minStockLevel}\n`;
        });
        csv += `\n`;

        csv += `TOP PRODUCTS (${period.toUpperCase()})\n`;
        csv += `Product,Quantity Sold,Revenue\n`;
        metrics.sales.topProducts.forEach(product => {
            csv += `${product.productName},${product.totalQuantity},${product.totalRevenue}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Dashboard_Report_${period}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    // ── Prepare default empty data structures for when metrics is null ──
    const safeMetrics = {
        sales: { topProducts: [] },
        inventory: { lowStockItems: [] },
        purchaseOrders: { supplierBalances: [] },
        recentActivity: { orders: [], purchaseOrders: [] },
        financials: {
            allTime: { totalRevenue: 0, totalExpenses: 0, totalPurchases: 0, netProfit: 0 },
            period: { totalRevenue: 0, totalExpenses: 0, totalPurchases: 0, netProfit: 0 }
        }
    };

    // ── Pagination instances (must be called unconditionally BEFORE any returns) ──
    const PAGE_SIZE = 5;
    const topProductsPag = usePagination(metrics?.sales.topProducts || safeMetrics.sales.topProducts, PAGE_SIZE);
    const lowStockPag = usePagination(metrics?.inventory.lowStockItems || safeMetrics.inventory.lowStockItems, PAGE_SIZE);
    const suppliersPag = usePagination(metrics?.purchaseOrders.supplierBalances || safeMetrics.purchaseOrders.supplierBalances, PAGE_SIZE);
    const recentOrdersPag = usePagination(metrics?.recentActivity.orders || safeMetrics.recentActivity.orders, PAGE_SIZE);
    const recentPOsPag = usePagination(metrics?.recentActivity.purchaseOrders || safeMetrics.recentActivity.purchaseOrders, PAGE_SIZE);

    // ── Conditional returns (AFTER all hooks) ───────────────────────────────────
    if (loading) {
        return (
            <Layout pageTitle="Business Dashboard">
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>Loading dashboard…</div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout pageTitle="Business Dashboard">
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ color: '#A32D2D', fontSize: '18px' }}>{error}</div>
                </div>
            </Layout>
        );
    }

    if (!metrics) return null;

    const periodLabel =
        period === 'week' ? 'Last week' :
        period === 'month' ? 'Last month' :
        period === 'quarter' ? 'Last quarter' : 'Last year';

    return (
        <Layout pageTitle="Business Dashboard">
            <div style={{
                padding: '28px 30px',
                maxWidth: '1600px',
                margin: '0 auto',
                fontFamily: 'var(--font-sans, system-ui, sans-serif)',
            }}>

                {/* ── Header ─────────────────────────────────────────────────── */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '32px',
                    flexWrap: 'wrap',
                    gap: '16px',
                }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            Elite Dashboard
                        </h1>
                        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                            Comprehensive overview of your business
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--border-radius)',
                                fontSize: '13px',
                                background: 'var(--background)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                            }}
                        >
                            <option value="week">Last week</option>
                            <option value="month">Last month</option>
                            <option value="quarter">Last quarter</option>
                            <option value="year">Last year</option>
                        </select>
                        <button
                            onClick={exportDashboard}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                background: '#185FA5',
                                color: '#E6F1FB',
                                border: 'none',
                                borderRadius: 'var(--border-radius)',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 500,
                            }}
                        >
                            <Download size={14} />
                            Export report
                        </button>
                    </div>
                </div>

                {/* ── All Time Performance ────────────────────────────────────── */}
                <p style={{
                    fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)',
                    textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 12px',
                }}>
                    All time performance
                </p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                    gap: '12px',
                    marginBottom: '28px',
                }}>
                    {[
                        {
                            label: 'Total revenue',
                            value: metrics.financials.allTime.totalRevenue,
                            color: '#185FA5', bg: '#E6F1FB',
                            icon: <DollarSign size={16} color="#185FA5" />,
                            neg: false,
                        },
                        {
                            label: 'Total expenses',
                            value: metrics.financials.allTime.totalExpenses,
                            color: '#A32D2D', bg: '#FCEBEB',
                            icon: <TrendingDown size={16} color="#A32D2D" />,
                            neg: false,
                        },
                        {
                            label: 'Total purchases',
                            value: metrics.financials.allTime.totalPurchases,
                            color: '#854F0B', bg: '#FAEEDA',
                            icon: <ShoppingBag size={16} color="#854F0B" />,
                            neg: false,
                        },
                        {
                            label: 'Net profit',
                            value: metrics.financials.allTime.netProfit,
                            color: metrics.financials.allTime.netProfit >= 0 ? '#3B6D11' : '#A32D2D',
                            bg:    metrics.financials.allTime.netProfit >= 0 ? '#EAF3DE' : '#FCEBEB',
                            icon:  metrics.financials.allTime.netProfit >= 0
                                ? <TrendingUp size={16} color="#3B6D11" />
                                : <TrendingDown size={16} color="#A32D2D" />,
                            neg: metrics.financials.allTime.netProfit < 0,
                        },
                    ].map((m, i) => (
                        <div key={i} style={{
                            background: 'var(--background)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--border-radius)',
                            borderTop: `2.5px solid ${m.color}`,
                            padding: '18px 20px',
                        }}>
                            <div style={{
                                width: 30, height: 30, borderRadius: 7,
                                background: m.bg, display: 'flex',
                                alignItems: 'center', justifyContent: 'center', marginBottom: 14,
                            }}>
                                {m.icon}
                            </div>
                            <p style={{
                                fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
                                textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px',
                            }}>
                                {m.label}
                            </p>
                            <p style={{
                                fontSize: 20, fontWeight: 600, margin: 0, lineHeight: 1.2,
                                color: m.neg ? '#A32D2D' : 'var(--text-primary)',
                            }}>
                                {m.neg ? '−' : ''}{Math.abs(m.value).toLocaleString('en-RW')}
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '3px 0 0' }}>RWF</p>
                        </div>
                    ))}
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 28px' }} />

                {/* ── Period Performance ──────────────────────────────────────── */}
                <p style={{
                    fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)',
                    textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 12px',
                }}>
                    {periodLabel} performance
                </p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                    gap: '12px',
                    marginBottom: '28px',
                }}>
                    {[
                        { label: 'Revenue',    value: metrics.financials.period.totalRevenue,  dot: '#185FA5', neg: false },
                        { label: 'Expenses',   value: metrics.financials.period.totalExpenses, dot: '#A32D2D', neg: false },
                        { label: 'Purchases',  value: metrics.financials.period.totalPurchases, dot: '#854F0B', neg: false },
                        {
                            label: 'Net profit',
                            value: metrics.financials.period.netProfit,
                            dot: metrics.financials.period.netProfit >= 0 ? '#3B6D11' : '#A32D2D',
                            neg: metrics.financials.period.netProfit < 0,
                        },
                    ].map((m, i) => (
                        <div key={i} style={{
                            background: 'var(--background)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--border-radius)',
                            padding: '18px 20px',
                        }}>
                            <p style={{
                                fontSize: 13, color: 'var(--text-secondary)',
                                margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 7,
                            }}>
                                <span style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: m.dot, display: 'inline-block', flexShrink: 0,
                                }} />
                                {m.label}
                            </p>
                            <p style={{
                                fontSize: 20, fontWeight: 600, margin: 0,
                                color: m.neg ? '#A32D2D' : 'var(--text-primary)',
                            }}>
                                {m.neg ? '−' : ''}{Math.abs(m.value).toLocaleString('en-RW')}
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '3px 0 0' }}>RWF</p>
                        </div>
                    ))}
                </div>

                {/* ── Top Products & Low Stock ────────────────────────────────── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
                    gap: '16px',
                    marginBottom: '16px',
                }}>
                    {/* Top Products */}
                    <Panel>
                        <PanelHead>
                            <Package size={16} />
                            <span style={{ fontSize: 14, fontWeight: 600 }}>Top selling products</span>
                            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-secondary)' }}>
                                {metrics.sales.topProducts.length} items
                            </span>
                        </PanelHead>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', minWidth: 420, borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Product</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Qty</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topProductsPag.paginated.map((p, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '11px 20px', fontWeight: 500 }}>{p.productName}</td>
                                            <td style={{ padding: '11px 20px', textAlign: 'right', color: 'var(--text-secondary)' }}>{p.totalQuantity}</td>
                                            <td style={{ padding: '11px 20px', textAlign: 'right', fontWeight: 600 }}>
                                                {p.totalRevenue.toLocaleString('en-RW')} RWF
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            page={topProductsPag.page}
                            totalPages={topProductsPag.totalPages}
                            total={metrics.sales.topProducts.length}
                            pageSize={PAGE_SIZE}
                            onPage={topProductsPag.setPage}
                        />
                    </Panel>

                    {/* Low Stock */}
                    <Panel>
                        <PanelHead>
                            <AlertTriangle size={16} color="#A32D2D" />
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#A32D2D' }}>Low stock alert</span>
                            <span style={{
                                fontSize: 11, padding: '2px 8px', borderRadius: 20,
                                background: '#FCEBEB', color: '#A32D2D', marginLeft: 'auto',
                            }}>
                                {metrics.inventory.lowStockItems.length} items
                            </span>
                        </PanelHead>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', minWidth: 420, borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Product</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Current</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Min level</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lowStockPag.paginated.map((item, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '11px 20px' }}>
                                                <div style={{ fontWeight: 500 }}>{item.name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{item.productCode}</div>
                                            </td>
                                            <td style={{ padding: '11px 20px', textAlign: 'right', fontWeight: 600, color: '#A32D2D' }}>
                                                {item.totalStock}
                                            </td>
                                            <td style={{ padding: '11px 20px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                                                {item.minStockLevel}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            page={lowStockPag.page}
                            totalPages={lowStockPag.totalPages}
                            total={metrics.inventory.lowStockItems.length}
                            pageSize={PAGE_SIZE}
                            onPage={lowStockPag.setPage}
                        />
                    </Panel>
                </div>

                {/* ── Supplier Balances ───────────────────────────────────────── */}
                {metrics.purchaseOrders.supplierBalances.length > 0 && (
                    <Panel>
                        <PanelHead>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>Outstanding supplier payments</span>
                            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-secondary)' }}>
                                {metrics.purchaseOrders.supplierBalances.length} suppliers
                            </span>
                        </PanelHead>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', minWidth: 420, borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Supplier</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>POs</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Amount due</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {suppliersPag.paginated.map((s, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '11px 20px', fontWeight: 500 }}>{s.supplierName}</td>
                                            <td style={{ padding: '11px 20px', textAlign: 'right', color: 'var(--text-secondary)' }}>{s.poCount}</td>
                                            <td style={{ padding: '11px 20px', textAlign: 'right', fontWeight: 600, color: '#A32D2D' }}>
                                                {s.totalDue.toLocaleString('en-RW')} RWF
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            page={suppliersPag.page}
                            totalPages={suppliersPag.totalPages}
                            total={metrics.purchaseOrders.supplierBalances.length}
                            pageSize={PAGE_SIZE}
                            onPage={suppliersPag.setPage}
                        />
                    </Panel>
                )}

                {/* ── Recent Activity ─────────────────────────────────────────── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                    gap: '16px',
                    marginTop: '16px',
                }}>
                    {/* Recent Sales Orders */}
                    <Panel>
                        <PanelHead>
                            <ShoppingBag size={16} />
                            <span style={{ fontSize: 14, fontWeight: 600 }}>Recent sales orders</span>
                            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-secondary)' }}>
                                {metrics.recentActivity.orders.length} total
                            </span>
                        </PanelHead>
                        {recentOrdersPag.paginated.map((o, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'flex-start',
                                padding: '12px 20px',
                                borderBottom: '1px solid var(--border-light)',
                                gap: 12,
                            }}>
                                <span style={{
                                    width: 7, height: 7, borderRadius: '50%',
                                    background: '#185FA5', display: 'inline-block',
                                    marginTop: 5, flexShrink: 0,
                                }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 13, fontWeight: 500,
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>
                                        {o.customerName}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                        by {o.managerName}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                                        {o.totalAmount.toLocaleString('en-RW')} RWF
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                        {new Date(o.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <Pagination
                            page={recentOrdersPag.page}
                            totalPages={recentOrdersPag.totalPages}
                            total={metrics.recentActivity.orders.length}
                            pageSize={PAGE_SIZE}
                            onPage={recentOrdersPag.setPage}
                        />
                    </Panel>

                    {/* Recent Purchase Orders */}
                    <Panel>
                        <PanelHead>
                            <Package size={16} />
                            <span style={{ fontSize: 14, fontWeight: 600 }}>Recent purchase orders</span>
                            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-secondary)' }}>
                                {metrics.recentActivity.purchaseOrders.length} total
                            </span>
                        </PanelHead>
                        {recentPOsPag.paginated.map((po, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'flex-start',
                                padding: '12px 20px',
                                borderBottom: '1px solid var(--border-light)',
                                gap: 12,
                            }}>
                                <span style={{
                                    width: 7, height: 7, borderRadius: '50%',
                                    background: '#854F0B', display: 'inline-block',
                                    marginTop: 5, flexShrink: 0,
                                }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 13, fontWeight: 500,
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>
                                        {po.poNumber}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                        {po.supplier.name}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                                        {po.grandTotal.toLocaleString('en-RW')} RWF
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                        {new Date(po.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <Pagination
                            page={recentPOsPag.page}
                            totalPages={recentPOsPag.totalPages}
                            total={metrics.recentActivity.purchaseOrders.length}
                            pageSize={PAGE_SIZE}
                            onPage={recentPOsPag.setPage}
                        />
                    </Panel>
                </div>

            </div>
        </Layout>
    );
};

export default DashboardBoss;