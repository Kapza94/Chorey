// ParentSettings.jsx — split config + budget/cadence + general settings

function ParentSettings({ kids = [] }) {
  const [split, setSplit] = React.useState({ spend: 40, save: 40, give: 20 });

  return (
    <div style={{ paddingBottom: 116 }}>
      <ParentHeader subtitle="Account" title="Settings." />

      <div style={{ padding: '0 18px' }}>
        {/* BUDGET & CADENCE */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: 'var(--fg-3)',
                      padding: '0 4px 8px' }}>
          Budget per kid
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {kids.map(k => <BudgetCard key={k.id} kid={k} />)}
          <div style={{ fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.45, padding: '2px 4px' }}>
            Chores add up toward the budget. You can still assign extra chores beyond it — anything over just keeps earning.
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: 'var(--fg-3)',
                      padding: '0 4px 8px' }}>
          The split
        </div>
        {/* SPLIT CONFIG */}
        <div style={{
          background: 'var(--cream-3)', borderRadius: 18,
          border: '1px solid var(--border)', padding: '18px 18px 16px',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                        textTransform: 'uppercase', color: 'var(--fg-3)' }}>
            How earnings split
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 24,
                        color: 'var(--fg-1)', marginTop: 4,
                        letterSpacing: '-0.01em' }}>
            {split.spend} / {split.save} / {split.give}
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 4,
                        lineHeight: 1.5 }}>
            Every dollar your kids earn splits into three buckets. The default
            teaches them spend, save and give in balance.
          </div>

          <div style={{ display: 'flex', height: 14, borderRadius: 999, overflow: 'hidden', gap: 2, marginTop: 14 }}>
            <div style={{ flex: split.spend, background: 'var(--allowance-400)' }}/>
            <div style={{ flex: split.save,  background: 'var(--savings-400)' }}/>
            <div style={{ flex: split.give,  background: 'var(--giving-400)' }}/>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
            <Pill tone="allowance" label="Spend" value={split.spend}/>
            <Pill tone="savings"   label="Save"  value={split.save}/>
            <Pill tone="giving"    label="Give"  value={split.give}/>
          </div>

          <button style={{
            marginTop: 16, width: '100%', padding: 12,
            borderRadius: 999, border: '1px solid var(--border-mid)',
            background: 'var(--cream-2)', color: 'var(--fg-1)',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
            fontFamily: 'inherit',
          }}>Edit per-kid splits</button>
        </div>

        {/* General settings list */}
        <div style={{
          background: 'var(--cream-3)', borderRadius: 16,
          border: '1px solid var(--border)', overflow: 'hidden',
        }}>
          {[
            { label: 'Charities Mia can give to', meta: '3 picked', icon: 'heart' },
            { label: 'Pay-out day',                meta: 'Sunday',  icon: 'chev' },
            { label: 'Notifications',              meta: 'On',      icon: 'spark' },
            { label: 'Linked bank account',        meta: 'Chase ••4421', icon: 'arrowR' },
            { label: 'Dark mode',                  meta: 'Auto',    icon: 'arrowR' },
          ].map((r, i, a) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px',
              borderBottom: i < a.length - 1 ? '1px solid var(--border)' : 0,
              cursor: 'pointer',
            }}>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{r.label}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{r.meta}</div>
              <Icon name="chev" size={14} color="var(--fg-3)"/>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 24,
                      fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--fg-3)' }}>
          chorey · v0.1
        </div>
      </div>
    </div>
  );
}

function Pill({ tone, label, value }) {  return (
    <div style={{
      flex: 1, background: `var(--${tone}-100)`, borderRadius: 12,
      padding: '10px 12px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: `var(--${tone}-800)` }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22,
                    color: `var(--${tone}-800)`, lineHeight: 1, marginTop: 2 }}>
        {value}<span style={{ fontSize: 12 }}>%</span>
      </div>
    </div>
  );
}

Object.assign(window, { ParentSettings });

function BudgetCard({ kid }) {
  const [cadence, setCadence] = React.useState(kid.cadence || 'weekly');
  const [budget, setBudget] = React.useState(kid.budget || 25);
  const step = (dir) => setBudget(b => Math.max(5, b + dir * 5));
  return (
    <div style={{
      background: 'var(--cream-3)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 999,
          background: `var(--${kid.tone}-200)`, color: `var(--${kid.tone}-800)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
        }}>{kid.avatar}</div>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>{kid.name}</div>
        {/* cadence toggle */}
        <div style={{ display: 'flex', background: 'var(--cream-1)', borderRadius: 999, padding: 3 }}>
          {['weekly', 'monthly'].map(c => (
            <button key={c} onClick={() => setCadence(c)} style={{
              padding: '6px 12px', borderRadius: 999, border: 0, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 700, textTransform: 'capitalize',
              background: cadence === c ? 'var(--cream-4)' : 'transparent',
              color: cadence === c ? 'var(--fg-1)' : 'var(--fg-3)',
              boxShadow: cadence === c ? 'var(--shadow-xs)' : 'none',
            }}>{c}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                        textTransform: 'uppercase', color: 'var(--fg-3)' }}>
            Budget cap
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26,
                           color: 'var(--fg-1)', fontVariantNumeric: 'tabular-nums' }}>
              ${budget}
            </span>
            <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>/ {cadence === 'monthly' ? 'mo' : 'wk'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <CapBtn onClick={() => step(-1)}>−</CapBtn>
          <CapBtn onClick={() => step(+1)}>+</CapBtn>
        </div>
      </div>
    </div>
  );
}

function CapBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 34, height: 34, borderRadius: 999, cursor: 'pointer',
      border: '1.5px solid var(--border-mid)', background: 'var(--cream-2)',
      color: 'var(--fg-1)', fontSize: 20, fontWeight: 700, lineHeight: 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'inherit', paddingBottom: 2,
    }}>{children}</button>
  );
}

Object.assign(window, { BudgetCard });
