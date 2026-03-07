import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { useGoogleAuth } from "./useGoogleAuth";
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'

type Card = {
  hiragana: string;
  romaji: string;
};

const HIRAGANA: Card[] = [
  { hiragana: "あ", romaji: "a" },
  { hiragana: "い", romaji: "i" },
  { hiragana: "う", romaji: "u" },
  { hiragana: "え", romaji: "e" },
  { hiragana: "お", romaji: "o" },
  { hiragana: "か", romaji: "ka" },
  { hiragana: "き", romaji: "ki" },
  { hiragana: "く", romaji: "ku" },
  { hiragana: "け", romaji: "ke" },
  { hiragana: "こ", romaji: "ko" },
  { hiragana: "さ", romaji: "sa" },
  { hiragana: "し", romaji: "shi" },
  { hiragana: "す", romaji: "su" },
  { hiragana: "せ", romaji: "se" },
  { hiragana: "そ", romaji: "so" },
  { hiragana: "た", romaji: "ta" },
  { hiragana: "ち", romaji: "chi" },
  { hiragana: "つ", romaji: "tsu" },
  { hiragana: "て", romaji: "te" },
  { hiragana: "と", romaji: "to" },
  { hiragana: "な", romaji: "na" },
  { hiragana: "に", romaji: "ni" },
  { hiragana: "ぬ", romaji: "nu" },
  { hiragana: "ね", romaji: "ne" },
  { hiragana: "の", romaji: "no" },
  { hiragana: "は", romaji: "ha" },
  { hiragana: "ひ", romaji: "hi" },
  { hiragana: "ふ", romaji: "fu" },
  { hiragana: "へ", romaji: "he" },
  { hiragana: "ほ", romaji: "ho" },
  { hiragana: "ま", romaji: "ma" },
  { hiragana: "み", romaji: "mi" },
  { hiragana: "む", romaji: "mu" },
  { hiragana: "め", romaji: "me" },
  { hiragana: "も", romaji: "mo" },
  { hiragana: "や", romaji: "ya" },
  { hiragana: "ゆ", romaji: "yu" },
  { hiragana: "よ", romaji: "yo" },
  { hiragana: "ら", romaji: "ra" },
  { hiragana: "り", romaji: "ri" },
  { hiragana: "る", romaji: "ru" },
  { hiragana: "れ", romaji: "re" },
  { hiragana: "ろ", romaji: "ro" },
  { hiragana: "わ", romaji: "wa" },
  { hiragana: "を", romaji: "wo" },
  { hiragana: "ん", romaji: "n" }
];

const DAKUTEN: Card[] = [
  { hiragana: "が", romaji: "ga" },
  { hiragana: "ぎ", romaji: "gi" },
  { hiragana: "ぐ", romaji: "gu" },
  { hiragana: "げ", romaji: "ge" },
  { hiragana: "ご", romaji: "go" },
  { hiragana: "ざ", romaji: "za" },
  { hiragana: "じ", romaji: "ji" },
  { hiragana: "ず", romaji: "zu" },
  { hiragana: "ぜ", romaji: "ze" },
  { hiragana: "ぞ", romaji: "zo" },
  { hiragana: "だ", romaji: "da" },
  { hiragana: "ぢ", romaji: "ji (di)" },
  { hiragana: "づ", romaji: "zu (du)" },
  { hiragana: "で", romaji: "de" },
  { hiragana: "ど", romaji: "do" },
  { hiragana: "ば", romaji: "ba" },
  { hiragana: "び", romaji: "bi" },
  { hiragana: "ぶ", romaji: "bu" },
  { hiragana: "べ", romaji: "be" },
  { hiragana: "ぼ", romaji: "bo" },
  { hiragana: "ぱ", romaji: "pa" },
  { hiragana: "ぴ", romaji: "pi" },
  { hiragana: "ぷ", romaji: "pu" },
  { hiragana: "ぺ", romaji: "pe" },
  { hiragana: "ぽ", romaji: "po" },
];

const DAKUTEN_WITH_BASIC = [...HIRAGANA, ...DAKUTEN];

const DECKS = {
  basic: {
    label: "Basic Hiragana",
    cards: HIRAGANA,
  },
  dakuten: {
    label: "Hiragana with Dakuten",
    cards: DAKUTEN_WITH_BASIC,
  },
};

// Gojūon rows interleaved with their dakuten variants so similar rows are adjacent.
// Each row has exactly 5 slots (a, i, u, e, o).
// null = combination doesn't exist in Japanese (e.g. yi, ye, wi, wu, we).
const GOJUON_GROUPS: (string | null)[][] = [
  ["あ","い","う","え","お"],
  ["か","き","く","け","こ"],
  ["が","ぎ","ぐ","げ","ご"],
  ["さ","し","す","せ","そ"],
  ["ざ","じ","ず","ぜ","ぞ"],
  ["た","ち","つ","て","と"],
  ["だ","ぢ","づ","で","ど"],
  ["な","に","ぬ","ね","の"],
  ["は","ひ","ふ","へ","ほ"],
  ["ば","び","ぶ","べ","ぼ"],
  ["ぱ","ぴ","ぷ","ぺ","ぽ"],
  ["ま","み","む","め","も"],
  ["や", null,"ゆ", null,"よ"],
  ["ら","り","る","れ","ろ"],
  ["わ", null, null, null,"を"],
  ["ん", null, null, null, null],
];

const REVIEW_PREF_KEY = "flashcards_review_open";
const ROUND_SIZE = 10;

const getStoredReviewPref = () => {
  if (typeof window === "undefined") return false;
  const stored = window.localStorage.getItem(REVIEW_PREF_KEY);
  return stored ? stored === "true" : false;
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickN<T>(arr: T[], n: number) {
  return shuffle(arr).slice(0, n);
}

function makeChoices(all: Card[], correct: Card): string[] {
  const others = all.filter((c) => c.romaji !== correct.romaji);
  const choices = pickN(others, 3).map((c) => c.romaji);
  choices.push(correct.romaji);
  return shuffle(choices);
}

function DeckPicker() {
  const navigate = useNavigate();
  return (
    <main className="deck-picker">
      <h2>Select a deck to begin</h2>
      <div className="deck-picker__options">
        {Object.entries(DECKS).map(([key, deckInfo]) => (
          <div key={key} className="deck-card">
            <Link to={`/decks/${key}`} className="deck-card__name">{deckInfo.label}</Link>
            <p className="deck-card__count">{deckInfo.cards.length} characters</p>
            <div className="deck-card__actions">
              <button className="button deck-card__revise" onClick={() => navigate(`/decks/${key}/revise`)}>Revise</button>
              <button className="button" onClick={() => navigate(`/decks/${key}/play`)}>Play Lv.1</button>
              <button className="button" onClick={() => navigate(`/decks/${key}/play2`)}>Play Lv.2</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function DeckDetail() {
  const { deckName } = useParams<{ deckName: string }>();
  const navigate = useNavigate();
  const deckInfo = deckName ? DECKS[deckName as keyof typeof DECKS] : null;

  if (!deckInfo) return <Navigate to="/" replace />;

  return (
    <main className="deck-detail">
      <h2>{deckInfo.label}</h2>
      <p className="deck-detail__count">{deckInfo.cards.length} characters</p>
      <div className="deck-detail__actions">
        <button className="button" onClick={() => navigate(`/decks/${deckName}/revise`)}>Revise</button>
        <button className="button" onClick={() => navigate(`/decks/${deckName}/play`)}>Play Lv.1</button>
        <button className="button" onClick={() => navigate(`/decks/${deckName}/play2`)}>Play Lv.2</button>
      </div>
    </main>
  );
}

function ReviseView() {
  const { deckName } = useParams<{ deckName: string }>();
  const navigate = useNavigate();
  const deckInfo = deckName ? DECKS[deckName as keyof typeof DECKS] : null;

  if (!deckInfo) return <Navigate to="/" replace />;

  const cardMap = new Map(deckInfo.cards.map((c) => [c.hiragana, c]));

  return (
    <main className="revise">
      <div className="revise__header">
        <h2>{deckInfo.label}</h2>
        <p className="revise__subtitle">{deckInfo.cards.length} characters</p>
      </div>
      <div className="revise__groups">
        {GOJUON_GROUPS.map((row, rowIdx) => {
          const hasAny = row.some((k) => k && cardMap.has(k));
          if (!hasAny) return null;
          return (
            <div key={rowIdx} className="revise__grid">
              {row.map((k, colIdx) => {
                const card = k ? cardMap.get(k) : undefined;
                return card ? (
                  <div key={k} className="revise__card">
                    <span className="revise__character">{card.hiragana}</span>
                    <span className="revise__romaji">{card.romaji}</span>
                  </div>
                ) : (
                  <div key={colIdx} className="revise__card revise__card--empty" />
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="revise__actions">
        <button className="button" onClick={() => navigate(`/decks/${deckName}`)}>Back to deck</button>
        <button className="button" onClick={() => navigate(`/decks/${deckName}/play`)}>Play Lv.1</button>
        <button className="button" onClick={() => navigate(`/decks/${deckName}/play2`)}>Play Lv.2</button>
      </div>
    </main>
  );
}

function PlayGame() {
  const { deckName } = useParams<{ deckName: string }>();
  const navigate = useNavigate();
  const deckInfo = deckName ? DECKS[deckName as keyof typeof DECKS] : null;

  const [gameKey, setGameKey] = useState(0);
  const [deck, setDeck] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [history, setHistory] = useState<{ card: Card; chosen: string; correct: boolean }[]>([]);
  const [reviewOpen, setReviewOpen] = useState(() => getStoredReviewPref());
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!deckInfo) { navigate('/', { replace: true }); return; }
    setDeck(pickN(deckInfo.cards, ROUND_SIZE));
    setIndex(0);
    setScore(0);
    setSelected(null);
    setShowAnswer(false);
    setHistory([]);
    setCountdown(null);
    setReviewOpen(getStoredReviewPref());
  }, [deckName, gameKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = deck[index];
  const isFinished = deck.length > 0 && index >= deck.length;

  const choices = useMemo(
    () => (current && deckInfo ? makeChoices(deckInfo.cards, current) : []),
    [deckInfo, current]
  );

  const next = useCallback(() => {
    setSelected(null);
    setShowAnswer(false);
    setIndex((i) => i + 1);
    setCountdown(null);
  }, []);

  const handleChoose = (choice: string) => {
    if (showAnswer) return;
    setSelected(choice);
    const correct = choice === current.romaji;
    if (correct) setScore((s) => s + 1);
    setHistory((h) => [...h, { card: current, chosen: choice, correct }]);
    setShowAnswer(true);
    setCountdown(2);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!deckInfo || isFinished) return;
    window.localStorage.setItem(REVIEW_PREF_KEY, String(reviewOpen));
  }, [reviewOpen, deckInfo, isFinished]);

  useEffect(() => {
    if (!showAnswer || countdown === null || isFinished) return;

    const intervalId = setInterval(() => {
      setCountdown((c) => {
        if (c === null) return null;
        if (c <= 1) {
          clearInterval(intervalId);
          next();
          return null;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [showAnswer, countdown, isFinished, next]);

  if (!deckInfo) return null;

  const reviewExpanded = isFinished ? true : reviewOpen;

  return (
    <>
      <div className="app__stats">
        <span className="app__stat">
          <strong>Deck</strong> {deckInfo.label}
        </span>
        <span className="app__stat">
          <strong>Round</strong> {Math.min(index + 1, deck.length)}/{deck.length}
        </span>
        <span className="app__stat">
          <strong>Score</strong> {score}
        </span>
      </div>

      {!isFinished && current && (
        <main>
          <section className="question">
            <div className="question__prompt">What is the romaji for this hiragana?</div>
            <div className="question__character">{current.hiragana}</div>
          </section>

          <section className="choices">
            {choices.map((c) => {
              const isCorrect = c === current.romaji;
              const isSelected = c === selected;

              const choiceClass = [
                "choice-btn",
                showAnswer && isCorrect ? "choice-btn--correct" : "",
                showAnswer && isSelected && !isCorrect ? "choice-btn--incorrect" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={c}
                  onClick={() => handleChoose(c)}
                  disabled={showAnswer}
                  className={choiceClass}
                >
                  {c}
                </button>
              );
            })}
          </section>

          <div className="action-row">
            {showAnswer ? (
              <div className="actions">
                <button className="button" onClick={next} disabled={!showAnswer}>
                  {showAnswer && countdown !== null
                    ? `${index + 1 >= deck.length ? "Finish" : "Next"} (${countdown})`
                    : index + 1 >= deck.length
                      ? "Finish"
                      : "Next"}
                </button>
              </div>
            ) : (
              <div className="actions actions--placeholder" aria-hidden="true" />
            )}
          </div>
        </main>
      )}

      {isFinished && (
        <section className="finished">
          <h2>Round complete</h2>
          <p>
            You scored <strong>{score}</strong> out of <strong>{deck.length}</strong>.
          </p>
          <div className="finished__actions">
            <button onClick={() => setGameKey((k) => k + 1)} className="button">
              Play again
            </button>
            <button className="button" onClick={() => navigate('/')}>
              Choose a different deck
            </button>
          </div>
        </section>
      )}

      {deck.length > 0 && (
        <section className="review review--persistent">
          <button
            className="review__header"
            onClick={() => {
              if (isFinished) return;
              setReviewOpen((o) => !o);
            }}
            aria-expanded={reviewExpanded}
          >
            <span className={`review__arrow ${reviewExpanded ? "review__arrow--open" : ""}`}>▸</span>
            <h2>Review answers</h2>
          </button>
          {reviewExpanded && (
            <>
              {history.length === 0 ? (
                <p className="review__empty">No answers yet. Play to see your history.</p>
              ) : (
                <ul className="review__list">
                  {[...history].reverse().map((h, i) => (
                    <li key={i} className="review__item">
                      <span className="review__character">{h.card.hiragana} {h.card.romaji}</span>
                      <span>
                        {h.correct ? (
                          <>✅</>
                        ) : (
                          <> — You Chose: <strong>{h.chosen}</strong> ❌</>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      )}
    </>
  );
}

function checkAnswer(input: string, romaji: string): boolean {
  const normalized = input.trim().toLowerCase();
  if (normalized === romaji.toLowerCase()) return true;
  // Handle parenthetical alternatives like "ji (di)" or "zu (du)"
  const match = romaji.match(/^(\S+)\s*\((\S+)\)$/);
  if (match) {
    return normalized === match[1].toLowerCase() || normalized === match[2].toLowerCase();
  }
  return false;
}

function PlayGame2() {
  const { deckName } = useParams<{ deckName: string }>();
  const navigate = useNavigate();
  const deckInfo = deckName ? DECKS[deckName as keyof typeof DECKS] : null;

  const [gameKey, setGameKey] = useState(0);
  const [deck, setDeck] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [history, setHistory] = useState<{ card: Card; chosen: string; correct: boolean }[]>([]);
  const [reviewOpen, setReviewOpen] = useState(() => getStoredReviewPref());
  const [countdown, setCountdown] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!deckInfo) { navigate('/', { replace: true }); return; }
    setDeck(pickN(deckInfo.cards, ROUND_SIZE));
    setIndex(0);
    setScore(0);
    setInputValue("");
    setShowAnswer(false);
    setIsCorrect(null);
    setHistory([]);
    setCountdown(null);
    setReviewOpen(getStoredReviewPref());
  }, [deckName, gameKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = deck[index];
  const isFinished = deck.length > 0 && index >= deck.length;

  const next = useCallback(() => {
    setInputValue("");
    setShowAnswer(false);
    setIsCorrect(null);
    setIndex((i) => i + 1);
    setCountdown(null);
  }, []);

  const handleSubmit = () => {
    if (showAnswer || !current) return;
    const correct = checkAnswer(inputValue, current.romaji);
    if (correct) setScore((s) => s + 1);
    setIsCorrect(correct);
    setHistory((h) => [...h, { card: current, chosen: inputValue.trim(), correct }]);
    setShowAnswer(true);
    setCountdown(2);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
  };

  useEffect(() => {
    if (!showAnswer && !isFinished && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showAnswer, isFinished, index]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!deckInfo || isFinished) return;
    window.localStorage.setItem(REVIEW_PREF_KEY, String(reviewOpen));
  }, [reviewOpen, deckInfo, isFinished]);

  useEffect(() => {
    if (!showAnswer || countdown === null || isFinished) return;

    const intervalId = setInterval(() => {
      setCountdown((c) => {
        if (c === null) return null;
        if (c <= 1) {
          clearInterval(intervalId);
          next();
          return null;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [showAnswer, countdown, isFinished, next]);

  if (!deckInfo) return null;

  const reviewExpanded = isFinished ? true : reviewOpen;

  return (
    <>
      <div className="app__stats">
        <span className="app__stat">
          <strong>Deck</strong> {deckInfo.label}
        </span>
        <span className="app__stat">
          <strong>Round</strong> {Math.min(index + 1, deck.length)}/{deck.length}
        </span>
        <span className="app__stat">
          <strong>Score</strong> {score}
        </span>
        <span className="app__stat app__stat--level">
          Level 2
        </span>
      </div>

      {!isFinished && current && (
        <main>
          <section className="question">
            <div className="question__prompt">Type the romaji for this hiragana:</div>
            <div className="question__character">{current.hiragana}</div>
          </section>

          <section className="type-answer">
            <input
              ref={inputRef}
              className={[
                "type-answer__input",
                showAnswer && isCorrect ? "type-answer__input--correct" : "",
                showAnswer && !isCorrect ? "type-answer__input--incorrect" : "",
              ].filter(Boolean).join(" ")}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={showAnswer}
              placeholder="e.g. ka"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            {!showAnswer && (
              <button className="button" onClick={handleSubmit} disabled={inputValue.trim() === ""}>
                Check
              </button>
            )}
            {showAnswer && (
              <div className="type-answer__feedback">
                {isCorrect ? (
                  <span className="type-answer__result type-answer__result--correct">✅ Correct!</span>
                ) : (
                  <span className="type-answer__result type-answer__result--incorrect">
                    ❌ Answer: <strong>{current.romaji}</strong>
                  </span>
                )}
              </div>
            )}
          </section>

          <div className="action-row">
            {showAnswer ? (
              <div className="actions">
                <button className="button" onClick={next}>
                  {showAnswer && countdown !== null
                    ? `${index + 1 >= deck.length ? "Finish" : "Next"} (${countdown})`
                    : index + 1 >= deck.length
                      ? "Finish"
                      : "Next"}
                </button>
              </div>
            ) : (
              <div className="actions actions--placeholder" aria-hidden="true" />
            )}
          </div>
        </main>
      )}

      {isFinished && (
        <section className="finished">
          <h2>Round complete</h2>
          <p>
            You scored <strong>{score}</strong> out of <strong>{deck.length}</strong>.
          </p>
          <div className="finished__actions">
            <button onClick={() => setGameKey((k) => k + 1)} className="button">
              Play again
            </button>
            <button className="button" onClick={() => navigate('/')}>
              Choose a different deck
            </button>
          </div>
        </section>
      )}

      {deck.length > 0 && (
        <section className="review review--persistent">
          <button
            className="review__header"
            onClick={() => {
              if (isFinished) return;
              setReviewOpen((o) => !o);
            }}
            aria-expanded={reviewExpanded}
          >
            <span className={`review__arrow ${reviewExpanded ? "review__arrow--open" : ""}`}>▸</span>
            <h2>Review answers</h2>
          </button>
          {reviewExpanded && (
            <>
              {history.length === 0 ? (
                <p className="review__empty">No answers yet. Play to see your history.</p>
              ) : (
                <ul className="review__list">
                  {[...history].reverse().map((h, i) => (
                    <li key={i} className="review__item">
                      <span className="review__character">{h.card.hiragana} {h.card.romaji}</span>
                      <span>
                        {h.correct ? (
                          <>✅</>
                        ) : (
                          <> — You typed: <strong>{h.chosen}</strong> ❌</>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      )}
    </>
  );
}

function App() {
  const { authError, userProfile, profileOpen, toggleProfile, signIn, signOut } = useGoogleAuth();

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__topbar">
          <h1 className="app__title">
            <Link to="/">Flashcards</Link>
          </h1>
          <div className="profile">
            <button className="profile__button" onClick={toggleProfile} aria-label="Profile">
              {userProfile?.picture ? (
                <img src={userProfile.picture} alt={userProfile.name || "Profile"} className="profile__avatar" />
              ) : (
                <span className="profile__avatar profile__avatar--placeholder">👤</span>
              )}
            </button>
            {profileOpen && (
              <div className="profile__panel">
                {userProfile ? (
                  <>
                    <div className="profile__name">{userProfile.name}</div>
                    <div className="profile__email">{userProfile.email}</div>
                    <button className="button profile__signout" onClick={signOut}>Sign out</button>
                  </>
                ) : (
                  <button className="button profile__signout" onClick={signIn}>Sign in</button>
                )}
              </div>
            )}
            {authError && <div className="profile__error">{authError}</div>}
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<DeckPicker />} />
        <Route path="/decks/:deckName" element={<DeckDetail />} />
        <Route path="/decks/:deckName/play" element={<PlayGame />} />
        <Route path="/decks/:deckName/play2" element={<PlayGame2 />} />
        <Route path="/decks/:deckName/revise" element={<ReviseView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
