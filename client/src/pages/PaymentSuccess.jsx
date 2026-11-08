import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import api, { errorMessage } from '../api.js';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const [state, setState] = useState({ loading: true });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    api.post('/payments/confirm', { paymentId: params.get('payment') })
      .then((r) => setState({ payment: r.data }))
      .catch((e) => setState({ error: errorMessage(e) }));
  }, [params]);

  if (state.loading) return <div className="page-loader">Confirming your payment...</div>;

  return (
    <div className="container page narrow">
      <div className="card center-card">
        {state.error ? (
          <>
            <XCircle size={48} className="icon-bad" />
            <h1>Payment not completed</h1>
            <p className="muted">{state.error}</p>
            <Link to="/donate" className="btn btn-primary">Try again</Link>
          </>
        ) : (
          <>
            <CheckCircle2 size={48} className="icon-good" />
            <h1>Thank you!</h1>
            <p className="muted">
              Your {state.payment.type === 'donation' ? 'donation' : 'adoption fee'} of ${state.payment.amount} was received
              {state.payment.pet && ` for ${state.payment.pet.name}`}.
            </p>
            <div className="row center-row">
              <Link to="/dashboard?tab=payments" className="btn btn-ghost">View payments</Link>
              <Link to="/pets" className="btn btn-primary">Browse pets</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
