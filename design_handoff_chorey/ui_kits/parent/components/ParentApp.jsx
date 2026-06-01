// ParentApp.jsx — top-level state + screen routing for the parent surface

// Each kid carries a budget cap + cadence. `earned` is what they've racked up
// this period (toward `budget`). Chores beyond the budget are allowed (extra).
const KIDS = [
  { id: 1, name: 'Mia', age: '9 years', avatar: 'M', tone: 'allowance',
    earned: 18.50, allowance: 7.40, savings: 7.40, giving: 3.70,
    choresDone: 4, choresTotal: 6, pendingApprovals: 2,
    cadence: 'weekly', budget: 25, assigned: 22.00 },
  { id: 2, name: 'Eli', age: '7 years', avatar: 'E', tone: 'savings',
    earned: 9.00, allowance: 3.60, savings: 3.60, giving: 1.80,
    choresDone: 3, choresTotal: 5, pendingApprovals: 0,
    cadence: 'weekly', budget: 15, assigned: 13.50 },
];

// Off-app payout history. Payments happen outside the app (cash / bank transfer);
// Chorey only keeps the record.
const PAYOUT_HISTORY = [
  { id: 'h1', kidId: 1, kidName: 'Mia', tone: 'allowance', date: 'May 25', period: 'Week of May 19', amount: 22.00, method: 'Cash' },
  { id: 'h2', kidId: 2, kidName: 'Eli', tone: 'savings',   date: 'May 25', period: 'Week of May 19', amount: 12.50, method: 'Bank transfer' },
  { id: 'h3', kidId: 1, kidName: 'Mia', tone: 'allowance', date: 'May 18', period: 'Week of May 12', amount: 19.00, method: 'Cash' },
  { id: 'h4', kidId: 2, kidName: 'Eli', tone: 'savings',   date: 'May 18', period: 'Week of May 12', amount: 11.00, method: 'Cash' },
];

function ParentApp({ initialTab }) {
  const [tab, setTab] = React.useState(initialTab || 'kids');
  const [selectedKid, setSelectedKid] = React.useState(null);

  // Lifted payout state so marking-paid persists across tab switches.
  const [history, setHistory] = React.useState(PAYOUT_HISTORY);
  const [paidThisPeriod, setPaidThisPeriod] = React.useState({}); // { [kidId]: {amount, method} }

  const markPaid = (kid, amount, method) => {
    setPaidThisPeriod(p => ({ ...p, [kid.id]: { amount, method } }));
    setHistory(h => [
      { id: 'n' + Date.now(), kidId: kid.id, kidName: kid.name, tone: kid.tone,
        date: 'Today', period: 'This week', amount, method },
      ...h,
    ]);
  };

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
      {tab === 'kids'     && <ParentKids kids={KIDS} onSelectKid={setSelectedKid}/>}
      {tab === 'chores'   && <ParentChores kids={KIDS}/>}
      {tab === 'pay'      && <ParentPayments kids={KIDS} history={history}
                              paidThisPeriod={paidThisPeriod} markPaid={markPaid}/>}
      {tab === 'settings' && <ParentSettings kids={KIDS}/>}

      <ParentTabBar active={tab} onChange={setTab} />
    </div>
  );
}

Object.assign(window, { ParentApp });
