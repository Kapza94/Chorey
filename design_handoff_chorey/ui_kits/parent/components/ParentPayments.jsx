// ParentPayments.jsx — off-app payout tracking dashboard
// Payments happen OUTSIDE the app (cash / bank transfer). Chorey keeps the record.
// Uses: ParentHeader, Icon, ParentIcon (window)

function ParentPayments({ kids, history, paidThisPeriod, markPaid }) {
  const [sheetKid, setSheetKid] = React.useState(null);

  const due = kids.filter(k => !paidThisPeriod[k.id]);
  const dueTotal = due.reduce((s, k) => s + k.earned, 0);
  const paidThisMonth = history
    .filter(h => h.date === 'Today' || h.period === 'This week' || h.date.startsWith('May 25') || h.date.startsWith('May 18'))
    .reduce((s, h) => s + h.amount, 0);

  return (
    <div style={{ paddingBottom: 116, position: 'relative' }}>
      <ParentHeader subtitle="Off-app payouts" title="Payments." />

      {/* Off-app explainer */}
      <div style={{
        margin: '0 18px 16px', padding: '12px 14px',
        background: 'var(--info-100)', borderRadius: 12,
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <Icon name="spark" size={16} color="var(--info-600)" strokeWidth={2.2}/>
        <div style={{ fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.45 }}>
          Pay your kids however you like — cash or bank transfer. Chorey just keeps the record.
        </div>
      </div>

      {/* Due now */}
      <div style={{ padding: '0 22px 8px', fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
        Due this period
      </div>

      {due.length === 0 ? (
        <div style={{ margin: '0 18px 8px', padding: '22px 18px', textAlign: 'center',
                      background: 'var(--cream-3)', border: '1px solid var(--border)',
                      borderRadius: 16 }}>
          <div style={{ display: 'inline-flex', width: 44, height: 44, borderRadius: 999,
                        background: 'var(--giving-200)', color: 'var(--giving-800)',
                        alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <Icon name="check" size={22} strokeWidth={3}/>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>All paid up.</div>
          <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>Nothing owed this period.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 18px' }}>
          {due.map(k => (
            <div key={k.id} style={{
              background: 'var(--cream-3)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '16px', boxShadow: 'var(--shadow-xs)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 999,
                  background: `var(--${k.tone}-200)`, color: `var(--${k.tone}-800)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19,
                }}>{k.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{k.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                    {k.cadence === 'monthly' ? 'This month' : 'This week'} · {k.choresDone} chores done
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700,
                                fontSize: 26, lineHeight: 1, color: 'var(--fg-1)',
                                fontVariantNumeric: 'tabular-nums' }}>
                    ${k.earned.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 2 }}>to pay out</div>
                </div>
              </div>

              {/* split mini */}
              <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--fg-2)',
                            paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid var(--border)' }}>
                <span><span className="d" style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 9, background: 'var(--allowance-400)', marginRight: 5 }}/><b>${k.allowance.toFixed(2)}</b> spend</span>
                <span><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 9, background: 'var(--savings-400)', marginRight: 5 }}/><b>${k.savings.toFixed(2)}</b> save</span>
                <span><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 9, background: 'var(--giving-400)', marginRight: 5 }}/><b>${k.giving.toFixed(2)}</b> give</span>
              </div>

              <button onClick={() => setSheetKid(k)} style={{
                width: '100%', padding: 12, borderRadius: 999, border: 0,
                background: 'var(--accent-600)', color: 'var(--cream-4)',
                fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <ParentIcon name="wallet" size={16}/> Mark as paid
              </button>
            </div>
          ))}
        </div>
      )}

      {/* This-period total */}
      {due.length > 0 && (
        <div style={{ margin: '16px 18px 0', padding: '14px 16px',
                      background: 'var(--cream-1)', borderRadius: 14,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--fg-2)', whiteSpace: 'nowrap' }}>Total to pay out</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22,
                         fontVariantNumeric: 'tabular-nums' }}>${dueTotal.toFixed(2)}</span>
        </div>
      )}

      {/* History */}
      <div style={{ padding: '26px 22px 8px', display: 'flex', alignItems: 'baseline',
                    justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                       textTransform: 'uppercase', color: 'var(--fg-3)' }}>
          Payout history
        </span>
        <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>
          ${paidThisMonth.toFixed(2)} this month
        </span>
      </div>

      <div style={{ margin: '0 18px', background: 'var(--cream-3)', borderRadius: 16,
                    border: '1px solid var(--border)', overflow: 'hidden' }}>
        {history.map((h, i) => (
          <div key={h.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
            borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 0,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 999, flexShrink: 0,
              background: `var(--${h.tone}-100)`, color: `var(--${h.tone}-800)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ParentIcon name="wallet" size={16}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{h.kidName}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{h.date} · {h.method}</div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
              ${h.amount.toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Mark-as-paid sheet */}
      {sheetKid && (
        <MarkPaidSheet kid={sheetKid}
          onClose={() => setSheetKid(null)}
          onConfirm={(amount, method) => { markPaid(sheetKid, amount, method); setSheetKid(null); }} />
      )}
    </div>
  );
}

function MarkPaidSheet({ kid, onClose, onConfirm }) {
  const [amount, setAmount] = React.useState(kid.earned.toFixed(2));
  const [method, setMethod] = React.useState('Cash');
  const methods = ['Cash', 'Bank transfer', 'Other'];
  return (
    <>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(42, 32, 24, 0.32)', zIndex: 50,
      }}/>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: 'var(--cream-4)', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: '14px 22px 30px', zIndex: 60, boxShadow: '0 -8px 30px rgba(42,32,24,0.18)',
      }}>
        <div style={{ width: 38, height: 4, background: 'var(--border-strong)',
                      borderRadius: 999, margin: '0 auto 16px' }}/>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24,
                      letterSpacing: '-0.02em', marginBottom: 4 }}>
          Pay {kid.name}.
        </div>
        <div style={{ fontSize: 13, color: 'var(--fg-2)', marginBottom: 18, lineHeight: 1.45 }}>
          Confirm once you've handed over the money. This only records it — no transfer happens in the app.
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 7 }}>Amount</div>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                         color: 'var(--fg-3)', fontSize: 18, fontWeight: 600 }}>$</span>
          <input value={amount} onChange={e => setAmount(e.target.value)} style={{
            width: '100%', boxSizing: 'border-box', background: 'var(--cream-2)',
            border: '1.5px solid var(--border-mid)', borderRadius: 12,
            padding: '14px 16px 14px 28px', fontFamily: 'inherit', fontSize: 18,
            fontWeight: 700, color: 'var(--fg-1)', fontVariantNumeric: 'tabular-nums', outline: 'none',
          }}/>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 7 }}>How you paid</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
          {methods.map(m => (
            <button key={m} onClick={() => setMethod(m)} style={{
              flex: 1, padding: '11px 6px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 13, fontWeight: 700,
              background: method === m ? 'var(--allowance-200)' : 'var(--cream-2)',
              color: method === m ? 'var(--allowance-800)' : 'var(--fg-2)',
              border: method === m ? '1.5px solid var(--allowance-400)' : '1.5px solid var(--border-mid)',
            }}>{m}</button>
          ))}
        </div>

        <button onClick={() => onConfirm(parseFloat(amount) || 0, method)} style={{
          width: '100%', padding: 15, borderRadius: 999, border: 0,
          background: 'var(--accent-600)', color: 'var(--cream-4)',
          fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit',
          whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Icon name="check" size={17} strokeWidth={3}/> Mark ${(parseFloat(amount) || 0).toFixed(2)} paid
        </button>
      </div>
    </>
  );
}

Object.assign(window, { ParentPayments, MarkPaidSheet });
