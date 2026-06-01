// OnboardingKid.jsx — kid join path + flow controller
// Uses: OBShell, OBPrimary, OBSecondary, Icon, BucketTriple (window)

function OBKidCode({ code, setCode, next, back }) {
  const cells = 6;
  const chars = code.padEnd(cells, ' ').slice(0, cells).split('');
  const onType = (v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, cells));
  return (
    <OBShell onBack={back} footer={
      <OBPrimary onClick={next} disabled={code.length < cells}>
        {code.length < cells ? 'Enter your code' : 'Join family'}
      </OBPrimary>
    }>
      <div style={{ marginTop: 6, marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700,
                      fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          Enter your code.
        </div>
        <div style={{ fontSize: 15, color: 'var(--fg-2)', marginTop: 10 }}>
          Ask a parent for the 6-character join code.
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          {chars.map((ch, i) => (
            <div key={i} style={{
              flex: 1, height: 58, borderRadius: 12,
              background: 'var(--cream-3)',
              border: `1.5px solid ${i === code.length ? 'var(--accent-600)' : 'var(--border-mid)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26,
              color: 'var(--fg-1)',
            }}>{ch.trim()}</div>
          ))}
        </div>
        <input
          autoFocus value={code} onChange={e => onType(e.target.value)}
          style={{
            position: 'absolute', inset: 0, opacity: 0, cursor: 'text',
            fontSize: 16,
          }}
        />
      </div>

      <button onClick={() => setCode('CHRVR1')} style={{
        marginTop: 16, background: 'transparent', border: 0, cursor: 'pointer',
        color: 'var(--fg-3)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
        textDecoration: 'underline', textUnderlineOffset: 3,
      }}>Use a sample code</button>
    </OBShell>
  );
}

function OBKidAvatar({ data, set, next, back }) {
  const ready = data.kidName.trim();
  return (
    <OBShell onBack={back} footer={
      <OBPrimary onClick={next} disabled={!ready}>That's me</OBPrimary>
    }>
      <div style={{ marginTop: 6, marginBottom: 22 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700,
                      fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          Make it yours.
        </div>
        <div style={{ fontSize: 15, color: 'var(--fg-2)', marginTop: 10 }}>
          Pick a color and tell us your name.
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
        <div style={{
          width: 96, height: 96, borderRadius: 999,
          background: `var(--${data.kidTone}-200)`, color: `var(--${data.kidTone}-800)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 44,
          border: '1px solid var(--border)',
          transition: 'background 200ms var(--ease-out)',
        }}>{(data.kidName.trim()[0] || '?').toUpperCase()}</div>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
        {KID_COLORS.map(c => (
          <button key={c.tone} onClick={() => set({ kidTone: c.tone })} aria-label={c.label} style={{
            width: 40, height: 40, borderRadius: 999, cursor: 'pointer',
            background: `var(--${c.tone}-400)`,
            border: data.kidTone === c.tone ? '3px solid var(--fg-1)' : '3px solid transparent',
            outline: data.kidTone === c.tone ? 'none' : '1px solid var(--border)',
          }}/>
        ))}
      </div>

      <OBField label="Your name" value={data.kidName}
               onChange={v => set({ kidName: v })} placeholder="e.g. Mia" autoFocus />
    </OBShell>
  );
}

function OBKidHow({ data, finish, back }) {
  const rows = [
    { tone: 'allowance', icon: 'gift',  title: 'Spend', body: 'Yours to use on your wishlist.' },
    { tone: 'savings',   icon: 'lock',  title: 'Save',  body: 'Grows over time. Stays locked.' },
    { tone: 'giving',    icon: 'heart', title: 'Give',  body: 'Goes to a cause you care about.' },
  ];
  return (
    <OBShell onBack={back} footer={<OBPrimary onClick={finish}>Start earning</OBPrimary>}>
      <div style={{ marginTop: 6, marginBottom: 22 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700,
                      fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          {data.kidName.trim() ? `Welcome, ${data.kidName.trim()}!` : 'How it works.'}
        </div>
        <div style={{ fontSize: 15, color: 'var(--fg-2)', marginTop: 10 }}>
          Every chore you finish pays you. Your money splits three ways.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map(r => (
          <div key={r.tone} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '16px', borderRadius: 16,
            background: `var(--${r.tone}-100)`,
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 13, flexShrink: 0,
              background: `var(--${r.tone}-200)`, color: `var(--${r.tone}-800)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={r.icon} size={24} strokeWidth={2}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: `var(--${r.tone}-800)` }}>{r.title}</div>
              <div style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 1 }}>{r.body}</div>
            </div>
          </div>
        ))}
      </div>
    </OBShell>
  );
}

// ── Flow controller ───────────────────────────────────────────────
// Controlled by `step` (string) + `setStep`; calls onComplete(role) at the end.
function Onboarding({ step, setStep, onComplete, logoSrc }) {
  const [data, setData] = React.useState({
    parentName: '', familyName: '', country: '',
    kids: [],
    split: { spend: 40, give: 20 },
    cadence: 'weekly', budget: 25,
    chores: [],
    charities: [],
    // kid path
    kidName: '', kidTone: 'allowance',
  });
  const set = (patch) => setData(d => ({ ...d, ...patch }));
  const [code, setCode] = React.useState('');

  const go = (s) => setStep(s);

  switch (step) {
    case 'welcome':   return <OBWelcome logoSrc={logoSrc} next={() => go('idea')} />;
    case 'idea':      return <OBIdea next={() => go('role')} back={() => go('welcome')} />;
    case 'role':      return <OBRole back={() => go('idea')}
                                     chooseParent={() => go('p_family')}
                                     chooseKid={() => go('k_code')} />;
    // parent path
    case 'p_family':  return <OBFamily data={data} set={set} next={() => go('p_addkid')} back={() => go('role')} />;
    case 'p_addkid':  return <OBAddKid data={data} set={set} next={() => go('p_split')} back={() => go('p_family')} />;
    case 'p_split':   return <OBSplit data={data} set={set} next={() => go('p_chores')} back={() => go('p_addkid')} />;
    case 'p_chores':  return <OBChores data={data} set={set} next={() => go('p_charity')} back={() => go('p_split')} />;
    case 'p_charity': return <OBCharity data={data} set={set} next={() => go('p_done')} back={() => go('p_chores')} />;
    case 'p_done':    return <OBParentDone data={data} finish={() => onComplete('parent')} />;
    // kid path
    case 'k_code':    return <OBKidCode code={code} setCode={setCode} next={() => go('k_avatar')} back={() => go('role')} />;
    case 'k_avatar':  return <OBKidAvatar data={data} set={set} next={() => go('k_how')} back={() => go('k_code')} />;
    case 'k_how':     return <OBKidHow data={data} finish={() => onComplete('kid')} back={() => go('k_avatar')} />;
    default:          return <OBWelcome logoSrc={logoSrc} next={() => go('idea')} />;
  }
}

Object.assign(window, { Onboarding, OBKidCode, OBKidAvatar, OBKidHow });
