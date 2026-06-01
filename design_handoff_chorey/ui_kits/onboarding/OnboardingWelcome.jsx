// OnboardingWelcome.jsx — welcome + the big-idea (40/40/20) screens
// Uses: OBShell, OBPrimary, OBSecondary, useMounted, Icon (window)

function OBWelcome({ next, logoSrc }) {
  const on = useMounted();
  return (
    <OBShell footer={
      <>
        <OBPrimary onClick={next}>Get started</OBPrimary>
        <OBSecondary onClick={next}>I already have an account</OBSecondary>
      </>
    }>
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        paddingBottom: 20,
      }}>
        <div style={{
          opacity: on ? 1 : 0, transform: on ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 500ms var(--ease-out)',
        }}>
          <img src={logoSrc} alt="" style={{ width: 96, height: 96 }} />
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 52, lineHeight: 1, letterSpacing: '-0.04em',
          marginTop: 22, color: 'var(--fg-1)',
          opacity: on ? 1 : 0, transform: on ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 500ms var(--ease-out) 80ms',
        }}>chorey</div>
        <div style={{
          fontSize: 17, color: 'var(--fg-2)', lineHeight: 1.5,
          marginTop: 14, maxWidth: 260,
          opacity: on ? 1 : 0, transform: on ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 500ms var(--ease-out) 160ms',
        }}>
          Chores that teach kids to <b style={{ color: 'var(--allowance-600)' }}>spend</b>,{' '}
          <b style={{ color: 'var(--savings-600)' }}>save</b>, and{' '}
          <b style={{ color: 'var(--giving-600)' }}>give</b>.
        </div>
      </div>
    </OBShell>
  );
}

function OBIdea({ next, back }) {
  const on = useMounted(120);
  const Bar = ({ tone, pct, label, amount, delay }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700,
                         fontSize: 22, color: `var(--${tone}-800)` }}>{pct}%</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-1)' }}>{label}</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: `var(--${tone}-600)`,
                       fontVariantNumeric: 'tabular-nums' }}>{amount}</span>
      </div>
      <div style={{ height: 12, background: 'var(--cream-0)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 999, background: `var(--${tone}-400)`,
          width: on ? pct + '%' : '0%',
          transition: `width 700ms var(--ease-out) ${delay}ms`,
        }}/>
      </div>
    </div>
  );
  return (
    <OBShell onBack={back} progress={{ index: 0, total: 4 }} footer={
      <OBPrimary onClick={next}>I'm in</OBPrimary>
    }>
      <div style={{ marginTop: 6 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700,
                      fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em',
                      color: 'var(--fg-1)' }}>
          Every dollar splits<br/>three ways.
        </div>
        <div style={{ fontSize: 15, color: 'var(--fg-2)', lineHeight: 1.5, marginTop: 10, marginBottom: 28 }}>
          When a kid earns $10, here's where it goes — automatically, every time.
        </div>

        <Bar tone="allowance" pct={40} label="Spend" amount="$4.00" delay={120} />
        <Bar tone="savings"   pct={40} label="Save"  amount="$4.00" delay={240} />
        <Bar tone="giving"    pct={20} label="Give"  amount="$2.00" delay={360} />

        <div style={{
          marginTop: 12, padding: '14px 16px', borderRadius: 14,
          background: 'var(--cream-3)', border: '1px solid var(--border)',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <div style={{ flexShrink: 0, marginTop: 1 }}>
            <Icon name="lock" size={18} color="var(--savings-600)" strokeWidth={2.2}/>
          </div>
          <div style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.45 }}>
            Savings stays locked — no spend button. That's how the habit sticks.
          </div>
        </div>
      </div>
    </OBShell>
  );
}

function OBRole({ chooseParent, chooseKid, back }) {
  const Card = ({ tone, title, body, onClick, icon }) => (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', cursor: 'pointer',
      background: 'var(--cream-3)', border: '1.5px solid var(--border)',
      borderRadius: 18, padding: '18px 18px', marginBottom: 12,
      display: 'flex', alignItems: 'center', gap: 16,
      fontFamily: 'inherit',
      transition: 'border-color 140ms var(--ease-out), transform 140ms var(--ease-out)',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = `var(--${tone}-400)`}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.99)'}
    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 16, flexShrink: 0,
        background: `var(--${tone}-200)`, color: `var(--${tone}-800)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={26} strokeWidth={2.2}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--fg-1)' }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 2, lineHeight: 1.4 }}>{body}</div>
      </div>
      <Icon name="chev" size={18} color="var(--fg-3)"/>
    </button>
  );
  return (
    <OBShell onBack={back} progress={{ index: 1, total: 4 }} footer={null}>
      <div style={{ marginTop: 6, marginBottom: 22 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700,
                      fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          Who's setting up?
        </div>
        <div style={{ fontSize: 15, color: 'var(--fg-2)', marginTop: 10 }}>
          Parents set up the family first, then kids join with a code.
        </div>
      </div>
      <Card tone="allowance" icon="user" title="I'm a parent"
            body="Set chores, the split, and approve payouts." onClick={chooseParent} />
      <Card tone="savings" icon="spark" title="Join as a kid"
            body="Got a code from a parent? Hop in here." onClick={chooseKid} />
    </OBShell>
  );
}

Object.assign(window, { OBWelcome, OBIdea, OBRole });
