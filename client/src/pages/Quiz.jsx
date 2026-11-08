import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import api, { errorMessage } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import PetCard from '../components/PetCard.jsx';

const QUESTIONS = [
  { key: 'home', title: 'Where do you live?', options: [['apartment', 'Apartment or small flat'], ['house', 'House with space or a garden']] },
  { key: 'kids', title: 'Are there young children at home?', options: [['yes', 'Yes'], ['no', 'No']] },
  { key: 'activity', title: 'How active is your daily routine?', options: [['low', 'Mostly relaxed'], ['medium', 'Some walks and play'], ['high', 'Very active, lots of outdoor time']] },
  { key: 'experience', title: 'Have you looked after a pet before?', options: [['first', 'This is my first pet'], ['experienced', 'Yes, I have experience']] },
  { key: 'species', title: 'Which kind of pet do you prefer?', options: [['any', 'Surprise me'], ['dog', 'Dog'], ['cat', 'Cat'], ['rabbit', 'Rabbit'], ['bird', 'Bird']] },
];

// Simple scoring. Higher score = better fit.
function score(pet, a) {
  let s = 0;
  if (a.home === 'apartment') s += { small: 3, medium: 1, large: -2 }[pet.size] ?? 0;
  if (a.home === 'house' && pet.size === 'large') s += 2;
  if (a.kids === 'yes') {
    if (pet.vaccinated) s += 2;
    if (['dog', 'cat', 'rabbit'].includes(pet.species)) s += 1;
    if (pet.size === 'large' && pet.age < 2) s -= 1;
  }
  if (a.activity === 'high') {
    if (pet.species === 'dog') s += 3;
    if (pet.size === 'large') s += 1;
  }
  if (a.activity === 'low') {
    if (['cat', 'rabbit', 'bird'].includes(pet.species)) s += 3;
    if (pet.species === 'dog' && pet.age >= 4) s += 2;
  }
  if (a.activity === 'medium' && ['dog', 'cat'].includes(pet.species)) s += 1;
  if (a.experience === 'first') {
    if (pet.age >= 2) s += 1;
    if (['cat', 'rabbit'].includes(pet.species)) s += 1;
  }
  if (a.species !== 'any') s += pet.species === a.species ? 4 : -3;
  return s;
}

export default function Quiz() {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const finish = async (final) => {
    setLoading(true);
    try {
      const res = await api.get('/pets', { params: { limit: 48 } });
      const ranked = res.data.pets
        .map((p) => ({ pet: p, s: score(p, final) }))
        .sort((x, y) => y.s - x.s)
        .slice(0, 6)
        .map(({ pet, s }) => ({ pet, percent: Math.max(40, Math.min(98, 55 + s * 6)) }));
      setResults(ranked);
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const choose = (key, value) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    if (step + 1 < QUESTIONS.length) setStep(step + 1);
    else finish(next);
  };

  const restart = () => { setStep(0); setAnswers({}); setResults(null); };

  if (results) {
    return (
      <div className="container page">
        <div className="page-head row">
          <div>
            <h1>Your best matches</h1>
            <p className="muted">Based on your answers. The percentage is a guide, so always meet the pet first.</p>
          </div>
          <button className="btn btn-ghost" onClick={restart}>Retake quiz</button>
        </div>
        {results.length === 0 ? (
          <div className="empty"><p>No pets are available right now.</p><Link to="/pets/new" className="btn btn-primary">List a pet</Link></div>
        ) : (
          <div className="grid">{results.map(({ pet, percent }) => <PetCard key={pet._id} pet={pet} matchPercent={percent} />)}</div>
        )}
      </div>
    );
  }

  const q = QUESTIONS[step];
  return (
    <div className="container page narrow">
      <div className="card quiz">
        <span className="step-icon"><Sparkles size={22} /></span>
        <p className="muted small">Question {step + 1} of {QUESTIONS.length}</p>
        <div className="progress"><span style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} /></div>
        <h1>{q.title}</h1>
        <div className="quiz-options">
          {q.options.map(([value, label]) => (
            <button key={value} className="quiz-option" disabled={loading} onClick={() => choose(q.key, value)}>{label}</button>
          ))}
        </div>
        {step > 0 && <button className="link-btn" onClick={() => setStep(step - 1)}>Back</button>}
      </div>
    </div>
  );
}
