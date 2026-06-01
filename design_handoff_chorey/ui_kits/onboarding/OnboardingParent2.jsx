// OnboardingParent2.jsx — first chores, charities, parent done
// Uses: OBShell, OBPrimary, OBSecondary, Icon (window)

const CHORE_PICKS = [
  { name: 'Make the bed',   value: 1.00 },
  { name: 'Dishes',         value: 2.50 },
  { name: 'Walk the dog',   value: 3.00 },
  { name: 'Take out trash', value: 2.00 },
  { name: 'Tidy room',      value: 2.00 },
  { name: 'Homework done',  value: 1.50 },
  { name: 'Set the table',  value: 1.00 },
  { name: 'Water plants',   value: 1.00 },
];

function OBChores({ data, set, next, back }) {
  const toggle = (name) => {
    const has = data.chores.find(c => c.name === name);
    if (has) set({ chores: data.chores.filter(c => c.name !== name) });
    else {
      const pick = CHORE_PICKS.find(c => c.name === name);
      set({ chores: [...data.chores, pick] });
    }
  };
  const total = data.chores.reduce((s, c) => s + c.value, 0);
  return (
    <OBShell onBack={back} footer={
      <OBPrimary onClick={next} disabled={data.chores.length === 0}>
        {data.chores.length ? `Add ${data.chores.length} ${data.chores.length === 1 ? 'chore' : 'chores'}` : 'Pick at least one'}
      </OBPrimary>
    }>
      <div style={{ marginTop: 6, marginBottom: 18 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700,
                      fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          First chores.
        </div>
        <div style={{ fontSize: 15, color: 'var(--fg-2)', marginTop: 10 }}>
          Tap to add a few. Edit the rewards anytime.
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
        {CHORE_PICKS.map(c => {
          const on = !!data.chores.find(x => x.name === c.name);
          return (
            <button key={c.name} onClick={() => toggle(c.name)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 15px', borderRadius: 999, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
              background: on ? 'var(--allowance-200)' : 'var(--cream-3)',
              color: on ? 'var(--allowance-800)' : 'var(--fg-1)',
              border: on ? '1.5px solid var(--allowance-400)' : '1.5px solid var(--border)',
              transition: 'all 140ms var(--ease-out)',
            }}>
              {on
                ? <Icon name="check" size={14} strokeWidth={3} color="var(--allowance-800)"/>
                : <Icon name="plus" size={14} strokeWidth={2.4} color="var(--fg-3)"/>}
              {c.name}
              <span style={{ opacity: 0.7, fontVariantNumeric: 'tabular-nums' }}>${c.value.toFixed(2)}</span>
            </button>
          );
        })}
      </div>

      {data.chores.length > 0 && (
        <div style={{
          marginTop: 22, padding: '14px 16px', borderRadius: 14,
          background: 'var(--cream-3)', border: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>
            Up to <b style={{ color: 'var(--fg-1)' }}>${total.toFixed(2)}</b> a day, if all done
          </span>
          <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>{data.chores.length} picked</span>
        </div>
      )}
    </OBShell>
  );
}

const CHARITY_PICKS = [
  { name: 'City Food Bank',     desc: 'Meals for local families', icon: 'gift' },
  { name: 'Animal Shelter',     desc: 'Care for rescue pets',     icon: 'heart' },
  { name: 'Clean Oceans',       desc: 'Protect beaches & seas',   icon: 'spark' },
  { name: "Children's Hospital", desc: 'Help kids get well',      icon: 'heart' },
];

function OBCharity({ data, set, next, back }) {
  const toggle = (name) => {
    if (data.charities.includes(name)) set({ charities: data.charities.filter(c => c !== name) });
    else set({ charities: [...data.charities, name] });
  };
  return (
    <OBShell onBack={back} footer={
      <>
        <OBPrimary onClick={next} disabled={data.charities.length === 0}>
          {data.charities.length ? 'Continue' : 'Pick at least one'}
        </OBPrimary>
        <OBSecondary onClick={next}>Skip for now</OBSecondary>
      </>
    }>
      <div style={{ marginTop: 6, marginBottom: 18 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700,
                      fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          Where giving goes.
        </div>
        <div style={{ fontSize: 15, color: 'var(--fg-2)', marginTop: 10 }}>
          Pick the causes your kids can choose between for their 20%.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {CHARITY_PICKS.map(c => {
          const on = data.charities.includes(c.name);
          return (
            <button key={c.name} onClick={() => toggle(c.name)} style={{
              width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: 16,
              background: on ? 'var(--giving-100)' : 'var(--cream-3)',
              border: on ? '1.5px solid var(--giving-400)' : '1.5px solid var(--border)',
              transition: 'all 140ms var(--ease-out)',
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: on ? 'var(--giving-200)' : 'var(--cream-1)',
                color: on ? 'var(--giving-800)' : 'var(--fg-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={c.icon} size={22} strokeWidth={2}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-1)' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 1 }}>{c.desc}</div>
              </div>
              <div style={{
                width: 24, height: 24, borderRadius: 999, flexShrink: 0,
                border: on ? 'none' : '1.5px solid var(--border-strong)',
                background: on ? 'var(--giving-400)' : 'transparent',
                color: 'var(--giving-800)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {on && <Icon name="check" size={14} strokeWidth={3}/>}
              </div>
            </button>
          );
        })}
      </div>
    </OBShell>
  );
}

function OBParentDone({ data, finish }) {
  const on = useMounted(100);
  const code = 'CH' + (data.familyName.replace(/[^A-Za-z]/g, '').toUpperCase() + 'KID').slice(0, 4);
  const total = data.chores.reduce((s, c) => s + c.value, 0);
  return (
    <OBShell footer={<OBPrimary onClick={finish}>Go to dashboard</OBPrimary>}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 10 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 999, alignSelf: 'flex-start',
          background: 'var(--giving-200)', color: 'var(--giving-800)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: on ? 'scale(1)' : 'scale(0.7)', opacity: on ? 1 : 0,
          transition: 'all 400ms var(--ease-spring)',
        }}>
          <Icon name="check" size={38} strokeWidth={3}/>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700,
                      fontSize: 34, lineHeight: 1.1, letterSpacing: '-0.02em', marginTop: 20 }}>
          You're all set.
        </div>
        <div style={{ fontSize: 15, color: 'var(--fg-2)', marginTop: 10, lineHeight: 1.5 }}>
          {data.kids.length} {data.kids.length === 1 ? 'kid' : 'kids'} · {data.chores.length} chores · up to ${total.toFixed(2)}/day.
        </div>

        <div style={{
          marginTop: 22, padding: '18px', borderRadius: 18,
          background: 'var(--cream-3)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                        textTransform: 'uppercase', color: 'var(--fg-3)' }}>
            Kid join code
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 34,
                          letterSpacing: '0.12em', color: 'var(--fg-1)' }}>{code}</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 999, background: 'var(--cream-1)',
              fontSize: 13, fontWeight: 700, color: 'var(--fg-2)', cursor: 'pointer',
            }}>
              <Icon name="arrowR" size={14}/>Share
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 8, lineHeight: 1.45 }}>
            Your kids enter this in the app to join the family.
          </div>
        </div>
      </div>
    </OBShell>
  );
}

Object.assign(window, { OBChores, OBCharity, OBParentDone, CHORE_PICKS, CHARITY_PICKS });
