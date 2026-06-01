// OnboardingParent.jsx — parent setup path screens
// Uses: OBShell, OBPrimary, OBSecondary, OBField, Icon (window)

// Country → local currency. At registration the parent picks a country and
// Chorey shows amounts in that local currency everywhere after.
const COUNTRIES = [
  { code: 'RS', name: 'Serbia',         cur: 'RSD', symbol: 'дин', decimals: 0 },
  { code: 'US', name: 'United States',  cur: 'USD', symbol: '$',   decimals: 2 },
  { code: 'GB', name: 'United Kingdom', cur: 'GBP', symbol: '£',   decimals: 2 },
  { code: 'DE', name: 'Germany',        cur: 'EUR', symbol: '€',   decimals: 2 },
  { code: 'HR', name: 'Croatia',        cur: 'EUR', symbol: '€',   decimals: 2 },
  { code: 'BA', name: 'Bosnia & Herz.', cur: 'BAM', symbol: 'KM',  decimals: 2 },
  { code: 'AU', name: 'Australia',      cur: 'AUD', symbol: 'A$',  decimals: 2 },
  { code: 'CA', name: 'Canada',         cur: 'CAD', symbol: 'C$',  decimals: 2 },
];

function OBFamily({ data, set, next, back }) {
  const ready = data.parentName.trim() && data.familyName.trim() && data.country;
  const country = COUNTRIES.find(c => c.code === data.country);
  return (
    <OBShell onBack={back} progress={{ index: 2, total: 4 }} footer={
      <OBPrimary onClick={next} disabled={!ready}>Continue</OBPrimary>
    }>
      <div style={{ marginTop: 6, marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700,
                      fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          Set up your family.
        </div>
        <div style={{ fontSize: 15, color: 'var(--fg-2)', marginTop: 10 }}>
          Just the basics — you can change anything later.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <OBField label="Your name" value={data.parentName}
                 onChange={v => set({ parentName: v })} placeholder="e.g. Alex" autoFocus />
        <OBField label="Family name" value={data.familyName}
                 onChange={v => set({ familyName: v })} placeholder="e.g. The Rivera Family" />

        {/* Country → sets the local currency */}
        <label style={{ display: 'block' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                        textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 7 }}>
            Country
          </div>
          <div style={{ position: 'relative' }}>
            <select value={data.country || ''} onChange={e => set({ country: e.target.value })}
              style={{
                width: '100%', boxSizing: 'border-box', appearance: 'none', WebkitAppearance: 'none',
                background: 'var(--cream-3)', border: '1.5px solid var(--border-mid)',
                borderRadius: 12, padding: '14px 40px 14px 16px',
                fontFamily: 'inherit', fontSize: 16,
                color: data.country ? 'var(--fg-1)' : 'var(--fg-4)', outline: 'none',
              }}>
              <option value="" disabled>Choose your country</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                           pointerEvents: 'none', color: 'var(--fg-3)' }}>
              <Icon name="chev" size={16} />
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 8, lineHeight: 1.45 }}>
            {country
              ? <>Amounts will show in <b style={{ color: 'var(--fg-2)' }}>{country.cur} ({country.symbol})</b> — your local currency.</>
              : <>We'll show all amounts in your local currency.</>}
          </div>
        </label>
      </div>
    </OBShell>
  );
}

const KID_COLORS = [
  { tone: 'allowance', label: 'Peach' },
  { tone: 'savings',   label: 'Lilac' },
  { tone: 'giving',    label: 'Sage' },
  { tone: 'info',      label: 'Sky' },
];

function OBAddKid({ data, set, next, back }) {
  const [name, setName] = React.useState('');
  const [age, setAge] = React.useState('');
  const [tone, setTone] = React.useState('allowance');

  const addKid = () => {
    if (!name.trim()) return;
    set({ kids: [...data.kids, { name: name.trim(), age: age || '—', tone }] });
    setName(''); setAge('');
    // rotate default color
    const idx = KID_COLORS.findIndex(c => c.tone === tone);
    setTone(KID_COLORS[(idx + 1) % KID_COLORS.length].tone);
  };

  return (
    <OBShell onBack={back} progress={{ index: 3, total: 4 }} footer={
      <OBPrimary onClick={next} disabled={data.kids.length === 0}>
        {data.kids.length ? 'Continue' : 'Add a kid to continue'}
      </OBPrimary>
    }>
      <div style={{ marginTop: 6, marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700,
                      fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          Add your kids.
        </div>
        <div style={{ fontSize: 15, color: 'var(--fg-2)', marginTop: 10 }}>
          Add one or more. They'll each get a join code.
        </div>
      </div>

      {/* existing kids */}
      {data.kids.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {data.kids.map((k, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--cream-3)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '10px 14px',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 999,
                background: `var(--${k.tone}-200)`, color: `var(--${k.tone}-800)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
              }}>{k.name[0].toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{k.name}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{k.age === '—' ? 'Age not set' : k.age + ' years'}</div>
              </div>
              <Icon name="check" size={18} color="var(--giving-600)" strokeWidth={2.6}/>
            </div>
          ))}
        </div>
      )}

      {/* add form */}
      <div style={{
        background: 'var(--cream-3)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '16px',
      }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 2 }}>
            <OBField label="Name" value={name} onChange={setName} placeholder="Kid's name" />
          </div>
          <div style={{ flex: 1 }}>
            <OBField label="Age" value={age} onChange={v => setAge(v.replace(/\D/g, '').slice(0,2))}
                     placeholder="9" type="text" />
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 8 }}>
          Color
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {KID_COLORS.map(c => (
            <button key={c.tone} onClick={() => setTone(c.tone)} aria-label={c.label} style={{
              width: 36, height: 36, borderRadius: 999, cursor: 'pointer',
              background: `var(--${c.tone}-400)`,
              border: tone === c.tone ? '3px solid var(--fg-1)' : '3px solid transparent',
              outline: tone === c.tone ? 'none' : '1px solid var(--border)',
              transition: 'border-color 140ms var(--ease-out)',
            }}/>
          ))}
        </div>
        <button onClick={addKid} disabled={!name.trim()} style={{
          width: '100%', padding: 12, borderRadius: 999,
          border: '1.5px dashed var(--border-mid)', background: 'transparent',
          color: name.trim() ? 'var(--fg-1)' : 'var(--fg-4)',
          fontWeight: 700, fontSize: 14, cursor: name.trim() ? 'pointer' : 'default',
          fontFamily: 'inherit', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 8,
        }}>
          <Icon name="plus" size={16}/> Add {data.kids.length ? 'another' : 'kid'}
        </button>
      </div>
    </OBShell>
  );
}

function OBSplit({ data, set, next, back }) {
  const { spend, give } = data.split;
  const save = 100 - spend - give;
  const step = (key, dir) => {
    let s = { ...data.split };
    if (key === 'spend') s.spend = Math.max(0, Math.min(80, s.spend + dir * 5));
    if (key === 'give')  s.give  = Math.max(0, Math.min(60, s.give  + dir * 5));
    if (100 - s.spend - s.give < 0) return;
    set({ split: s });
  };
  const isDefault = spend === 40 && give === 20;

  const Stepper = ({ tone, label, value, k, editable }) => (
    <div style={{
      flex: 1, background: `var(--${tone}-100)`, borderRadius: 14, padding: '12px 12px 10px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase', color: `var(--${tone}-800)`, textAlign: 'center' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28,
                    color: `var(--${tone}-800)`, textAlign: 'center', lineHeight: 1.1 }}>
        {value}<span style={{ fontSize: 14 }}>%</span>
      </div>
      {editable ? (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'center' }}>
          <StepBtn tone={tone} onClick={() => step(k, -1)}>−</StepBtn>
          <StepBtn tone={tone} onClick={() => step(k, +1)}>+</StepBtn>
        </div>
      ) : (
        <div style={{ marginTop: 8, textAlign: 'center', fontSize: 10,
                      color: `var(--${tone}-600)`, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Icon name="lock" size={11} color={`var(--${tone}-600)`} strokeWidth={2.4}/>auto
        </div>
      )}
    </div>
  );

  return (
    <OBShell onBack={back} footer={
      <>
        <OBPrimary onClick={next}>{isDefault ? 'Use the 40/40/20 split' : 'Use this split'}</OBPrimary>
        {!isDefault && <OBSecondary onClick={() => set({ split: { spend: 40, give: 20 } })}>Reset to 40/40/20</OBSecondary>}
      </>
    }>
      <div style={{ marginTop: 6, marginBottom: 18 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700,
                      fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          Budget &amp; split.
        </div>
        <div style={{ fontSize: 15, color: 'var(--fg-2)', marginTop: 10 }}>
          Set how much each kid can earn, and how their money divides.
        </div>
      </div>

      {/* Budget cap + cadence */}
      <div style={{
        background: 'var(--cream-3)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '16px', marginBottom: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                         textTransform: 'uppercase', color: 'var(--fg-3)' }}>Budget cap</span>
          <div style={{ display: 'flex', background: 'var(--cream-1)', borderRadius: 999, padding: 3 }}>
            {['weekly', 'monthly'].map(c => (
              <button key={c} onClick={() => set({ cadence: c })} style={{
                padding: '6px 14px', borderRadius: 999, border: 0, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 12, fontWeight: 700, textTransform: 'capitalize',
                background: data.cadence === c ? 'var(--cream-4)' : 'transparent',
                color: data.cadence === c ? 'var(--fg-1)' : 'var(--fg-3)',
                boxShadow: data.cadence === c ? 'var(--shadow-xs)' : 'none',
              }}>{c}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 34,
                           color: 'var(--fg-1)', fontVariantNumeric: 'tabular-nums' }}>${data.budget}</span>
            <span style={{ fontSize: 14, color: 'var(--fg-3)' }}>/ {data.cadence === 'monthly' ? 'month' : 'week'}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <StepBtn tone="allowance" onClick={() => set({ budget: Math.max(5, data.budget - 5) })}>−</StepBtn>
            <StepBtn tone="allowance" onClick={() => set({ budget: data.budget + 5 })}>+</StepBtn>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 10, lineHeight: 1.45 }}>
          Chores add up toward this. Extra chores beyond the cap still earn — your call.
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 10 }}>
        How it divides
      </div>

      <div style={{ display: 'flex', height: 16, borderRadius: 999, overflow: 'hidden', gap: 3, marginBottom: 18 }}>
        <div style={{ flex: spend, background: 'var(--allowance-400)', transition: 'flex 200ms var(--ease-out)' }}/>
        <div style={{ flex: save,  background: 'var(--savings-400)',  transition: 'flex 200ms var(--ease-out)' }}/>
        <div style={{ flex: give,  background: 'var(--giving-400)',   transition: 'flex 200ms var(--ease-out)' }}/>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Stepper tone="allowance" label="Spend" value={spend} k="spend" editable />
        <Stepper tone="savings"   label="Save"  value={save} k="save" />
        <Stepper tone="giving"    label="Give"  value={give} k="give" editable />
      </div>
    </OBShell>
  );
}

function StepBtn({ children, onClick, tone }) {
  return (
    <button onClick={onClick} style={{
      width: 30, height: 30, borderRadius: 999, cursor: 'pointer',
      border: `1.5px solid var(--${tone}-400)`, background: 'var(--cream-4)',
      color: `var(--${tone}-800)`, fontSize: 18, fontWeight: 700,
      lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'inherit', paddingBottom: 2,
    }}>{children}</button>
  );
}

Object.assign(window, { OBFamily, OBAddKid, OBSplit, KID_COLORS });
