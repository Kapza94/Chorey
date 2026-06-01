// KidApp.jsx — top-level state + screen routing for the kid surface

const STARTING_CHORES = [
  { id: 1, name: 'Make the bed',    value: 1.00, note: 'morning', done: true  },
  { id: 2, name: 'Pack school bag', value: 1.00, note: 'before 8am', done: true },
  { id: 3, name: 'Dishes after lunch', value: 2.50, note: 'kitchen', done: false },
  { id: 4, name: 'Walk Buddy',      value: 3.00, note: '15 min', done: false },
  { id: 5, name: 'Read 20 min',     value: 1.50, note: 'anytime', done: false },
];

const STARTING_TOTALS = {
  // base "this week" totals from earlier days
  base: 10.50,
};

function computeTotals(chores) {
  const earnedToday = chores.filter(c => c.done).reduce((s, c) => s + c.value, 0);
  const total = STARTING_TOTALS.base + earnedToday;
  return {
    earned: total,
    allowance: total * 0.4,
    savings:   total * 0.4,
    giving:    total * 0.2,
  };
}

function KidApp({ initialTab }) {
  const [chores, setChores] = React.useState(STARTING_CHORES);
  const [tab, setTab] = React.useState(initialTab || 'home');

  const toggle = (id) => {
    setChores(prev => prev.map(c => c.id === id ? { ...c, done: !c.done } : c));
  };

  const totals = computeTotals(chores);

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'var(--cream-2)',
      color: 'var(--fg-1)',
      fontFamily: 'var(--font-body)',
      position: 'relative',
      overflowY: 'auto',
      overflowX: 'hidden',
      paddingTop: 54,    /* clear iOS status bar + dynamic island */
    }}>
      {tab === 'home' && <KidHome chores={chores} onToggle={toggle} totals={totals} />}
      {tab === 'wish' && <KidWishlist totals={totals} />}
      {tab === 'you'  && <KidYou totals={totals} />}

      <KidTabBar active={tab} onChange={setTab} />
    </div>
  );
}

Object.assign(window, { KidApp });
