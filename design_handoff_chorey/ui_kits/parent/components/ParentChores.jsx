// ParentChores.jsx — chore library + add new chore

function ParentChores({ onBack, kids = [] }) {
  const [showAdd, setShowAdd] = React.useState(false);
  const [name, setName] = React.useState('');
  const [value, setValue] = React.useState('2.00');
  const [assignee, setAssignee] = React.useState('Mia');

  const chores = [
    { name: 'Make the bed',    value: 1.00, kids: ['Mia', 'Eli'], freq: 'Daily' },
    { name: 'Take out trash',  value: 2.00, kids: ['Eli'],         freq: 'Tue, Fri' },
    { name: 'Walk Buddy',      value: 3.00, kids: ['Mia'],         freq: 'Daily' },
    { name: 'Dishes after dinner', value: 2.50, kids: ['Mia','Eli'], freq: 'Daily' },
    { name: 'Vacuum living room', value: 4.00, kids: ['Mia'],      freq: 'Sat' },
    { name: 'Read 20 min',     value: 1.50, kids: ['Mia','Eli'],   freq: 'Daily' },
  ];

  return (
    <div style={{ paddingBottom: 116, position: 'relative' }}>
      <ParentHeader subtitle="Library" title="Chores."
        action={
          <button onClick={() => setShowAdd(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 999, border: 0,
            background: 'var(--accent-600)', color: 'var(--cream-4)',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
            <Icon name="plus" size={14} strokeWidth={2.6}/>New
          </button>
        }
      />

      {/* Budget context — assigned vs cap per kid */}
      {kids.length > 0 && (
        <div style={{ display: 'flex', gap: 10, padding: '0 18px 14px' }}>
          {kids.map(k => {
            const assigned = k.assigned != null ? k.assigned : 0;
            const bpct = Math.min(100, (assigned / k.budget) * 100);
            const over = assigned > k.budget;
            return (
              <div key={k.id} style={{
                flex: 1, background: 'var(--cream-3)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{k.name}</span>
                  <span style={{ fontSize: 11, color: over ? 'var(--warning-600)' : 'var(--fg-3)', fontWeight: 700 }}>
                    {over ? 'over cap' : `$${(k.budget - assigned).toFixed(0)} left`}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--fg-2)', margin: '4px 0 7px',
                              fontVariantNumeric: 'tabular-nums' }}>
                  <b style={{ color: 'var(--fg-1)' }}>${assigned.toFixed(2)}</b> of ${k.budget}/{k.cadence === 'monthly' ? 'mo' : 'wk'}
                </div>
                <div style={{ height: 6, background: 'var(--cream-1)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: bpct + '%', height: '100%', borderRadius: 999,
                                background: over ? 'var(--warning-600)' : `var(--${k.tone}-400)` }}/>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{
        margin: '0 18px', background: 'var(--cream-3)', borderRadius: 16,
        border: '1px solid var(--border)', overflow: 'hidden',
      }}>
        {chores.map((c, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px',
            borderBottom: i < chores.length - 1 ? '1px solid var(--border)' : 0,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-1)' }}>
                {c.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2,
                            display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{c.freq}</span>
                <span style={{ color: 'var(--fg-4)' }}>·</span>
                <span>{c.kids.join(', ')}</span>
              </div>
            </div>
            <div style={{
              fontWeight: 700, fontSize: 15,
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--fg-1)',
            }}>
              ${c.value.toFixed(2)}
            </div>
            <Icon name="chev" size={16} color="var(--fg-3)"/>
          </div>
        ))}
      </div>

      {/* Bottom sheet — add chore */}
      {showAdd && (
        <>
          <div onClick={() => setShowAdd(false)} style={{
            position: 'absolute', inset: 0,
            background: 'rgba(42, 32, 24, 0.32)',
            zIndex: 50,
          }}/>
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            background: 'var(--cream-4)',
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: '14px 22px 30px',
            zIndex: 60, boxShadow: '0 -8px 30px rgba(42,32,24,0.18)',
          }}>
            {/* drag handle */}
            <div style={{
              width: 38, height: 4, background: 'var(--border-strong)',
              borderRadius: 999, margin: '0 auto 14px',
            }}/>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 24,
                          color: 'var(--fg-1)', letterSpacing: '-0.02em',
                          marginBottom: 16 }}>
              New chore.
            </div>

            <label style={{ display: 'block', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                            textTransform: 'uppercase', color: 'var(--fg-3)',
                            marginBottom: 6 }}>Name</div>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Make the bed" style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--cream-2)',
                border: '1px solid var(--border-mid)',
                borderRadius: 10, padding: '11px 14px',
                fontFamily: 'inherit', fontSize: 15, color: 'var(--fg-1)',
              }}/>
            </label>

            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <label style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                              textTransform: 'uppercase', color: 'var(--fg-3)',
                              marginBottom: 6 }}>Reward</div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: 11,
                                 color: 'var(--fg-3)', fontSize: 15 }}>$</span>
                  <input value={value} onChange={e => setValue(e.target.value)}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'var(--cream-2)',
                      border: '1px solid var(--border-mid)',
                      borderRadius: 10, padding: '11px 14px 11px 24px',
                      fontFamily: 'inherit', fontSize: 15, color: 'var(--fg-1)',
                      fontVariantNumeric: 'tabular-nums',
                    }}/>
                </div>
              </label>
              <label style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                              textTransform: 'uppercase', color: 'var(--fg-3)',
                              marginBottom: 6 }}>Assign to</div>
                <select value={assignee} onChange={e => setAssignee(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'var(--cream-2)',
                    border: '1px solid var(--border-mid)',
                    borderRadius: 10, padding: '11px 14px',
                    fontFamily: 'inherit', fontSize: 15, color: 'var(--fg-1)',
                    appearance: 'none', WebkitAppearance: 'none',
                  }}>
                  <option>Mia</option>
                  <option>Eli</option>
                  <option>Both</option>
                </select>
              </label>
            </div>

            {/* Preview of split */}
            <div style={{
              background: 'var(--cream-1)', borderRadius: 12,
              padding: '12px 14px', marginBottom: 16,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                            textTransform: 'uppercase', color: 'var(--fg-3)',
                            marginBottom: 8 }}>How ${value} splits</div>
              <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', gap: 2 }}>
                <div style={{ flex: 40, background: 'var(--allowance-400)' }}/>
                <div style={{ flex: 40, background: 'var(--savings-400)' }}/>
                <div style={{ flex: 20, background: 'var(--giving-400)' }}/>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                            marginTop: 8, fontSize: 11, color: 'var(--fg-2)' }}>
                <span><b style={{ color: 'var(--allowance-800)' }}>${(parseFloat(value) * 0.4).toFixed(2)}</b> spend</span>
                <span><b style={{ color: 'var(--savings-800)' }}>${(parseFloat(value) * 0.4).toFixed(2)}</b> save</span>
                <span><b style={{ color: 'var(--giving-800)' }}>${(parseFloat(value) * 0.2).toFixed(2)}</b> give</span>
              </div>
            </div>

            <button onClick={() => setShowAdd(false)} style={{
              width: '100%', padding: 14, borderRadius: 999, border: 0,
              background: 'var(--accent-600)', color: 'var(--cream-4)',
              fontWeight: 700, fontSize: 15, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>Add chore</button>
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { ParentChores });
