import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { useGoogleAuth } from "./useGoogleAuth";
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

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

const REVIEW_PREF_KEY = "flashcards_review_open";
const DECK_QUERY_KEY = "deck";
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


function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // prepare a deck for the round (10 unique cards)
  const [activeDeckKey, setActiveDeckKey] = useState<keyof typeof DECKS | null>(null);
  const [deck, setDeck] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [history, setHistory] = useState<{ card: Card; chosen: string; correct: boolean }[]>([]);
  const [reviewOpen, setReviewOpen] = useState(() => getStoredReviewPref());
  const [countdown, setCountdown] = useState<number | null>(null);
  const { authError, userProfile, profileOpen, toggleProfile, signIn, signOut } = useGoogleAuth();

  const resetState = useCallback(() => {
    setActiveDeckKey(null);
    setDeck([]);
    setIndex(0);
    setScore(0);
    setSelected(null);
    setShowAnswer(false);
    setHistory([]);
    setCountdown(null);
    setReviewOpen(getStoredReviewPref());
  }, []);

  const applyDeck = useCallback((deckKey: keyof typeof DECKS) => {
    setActiveDeckKey(deckKey);
    setDeck(pickN(DECKS[deckKey].cards, ROUND_SIZE));
    setIndex(0);
    setScore(0);
    setSelected(null);
    setShowAnswer(false);
    setHistory([]);
    setCountdown(null);
    setReviewOpen(getStoredReviewPref());
  }, []);

  const startGame = useCallback((deckKey: keyof typeof DECKS) => {
    const targetSearch = `?${DECK_QUERY_KEY}=${deckKey}`;
    const isOnPlay = location.pathname === "/play";
    const isSameDeck = location.search === targetSearch;

    if (isOnPlay && isSameDeck) {
      applyDeck(deckKey);
      return;
    }

    navigate({
      pathname: "/play",
      search: targetSearch,
    });
  }, [applyDeck, location.pathname, location.search, navigate]);

  const newGame = useCallback(() => {
    resetState();
    navigate("/");
  }, [navigate, resetState]);

  const current = deck[index];

  // memoize choices for current card so they don't change while user decides
  const choices = useMemo(() => (current && activeDeckKey ? makeChoices(DECKS[activeDeckKey].cards, current) : []), [activeDeckKey, current]);

  const handleChoose = (choice: string) => {
    if (showAnswer) return; // prevent re-selection
    setSelected(choice);
    const correct = choice === current.romaji;
    if (correct) setScore((s) => s + 1);
    setHistory((h) => [...h, { card: current, chosen: choice, correct }]);
    setShowAnswer(true);
    setCountdown(2);
  };

  const next = () => {
    setSelected(null);
    setShowAnswer(false);
    setIndex((i) => i + 1);
    setCountdown(null);
  };

  const isFinished = index >= deck.length;

  useEffect(() => {
    // if user reaches end, index === deck.length triggers finished state
    if (index >= deck.length) {
      // nothing else for now
    }
  }, [index, deck.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!activeDeckKey || isFinished) return; // only persist during active play
    window.localStorage.setItem(REVIEW_PREF_KEY, String(reviewOpen));
  }, [reviewOpen, activeDeckKey, isFinished]);

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
  }, [showAnswer, countdown, isFinished]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const deckKey = params.get(DECK_QUERY_KEY) as keyof typeof DECKS | null;

    if (location.pathname === "/play") {
      if (deckKey && DECKS[deckKey]) {
        applyDeck(deckKey);
      } else {
        navigate("/", { replace: true });
      }
    } else {
      resetState();
    }
  }, [location.pathname, location.search, applyDeck, resetState, navigate]);

  const reviewExpanded = isFinished ? true : reviewOpen;

  const handleProfileClick = () => {
    toggleProfile();
  };

  const handleSignIn = () => {
    signIn();
  };

  const handleSignOut = () => {
    signOut();
  };

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__topbar">
          <h1 className="app__title">Flashcards</h1>
          <div className="profile">
            <button className="profile__button" onClick={handleProfileClick} aria-label="Profile">
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
                    <button className="button profile__signout" onClick={handleSignOut}>Sign out</button>
                  </>
                ) : (
                  <button className="button profile__signout" onClick={handleSignIn}>Sign in</button>
                )}
              </div>
            )}
            {authError && <div className="profile__error">{authError}</div>}
          </div>
        </div>

        <div className="app__stats">
          {activeDeckKey && (
            <>
              <span className="app__stat">
                <strong>Deck</strong> {DECKS[activeDeckKey].label}
              </span>
              <span className="app__stat">
                <strong>Round</strong> {Math.min(index + 1, deck.length)}/{deck.length}
              </span>
              <span className="app__stat">
                <strong>Score</strong> {score}
              </span>
              <button className="button" onClick={newGame}>
                New Game
              </button>
            </>
          )}
        </div>
      </header>

      <Routes>
        <Route
          path="/"
          element={
            <main className="deck-picker">
              <h2>Select a deck to begin</h2>
              <div className="deck-picker__options">
                {Object.entries(DECKS).map(([key, deckInfo]) => (
                  <button key={key} className="button deck-picker__button" onClick={() => startGame(key as keyof typeof DECKS)}>
                    {deckInfo.label}
                  </button>
                ))}
              </div>
            </main>
          }
        />

        <Route
          path="/play"
          element={
            <>
              {activeDeckKey && !isFinished && current && (
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
                        <button
                          className="button"
                          onClick={next}
                          disabled={!showAnswer}
                        >
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

              {activeDeckKey && isFinished && (
                <section className="finished">
                  <h2>Round complete</h2>
                  <p>
                    You scored <strong>{score}</strong> out of <strong>{deck.length}</strong>.
                  </p>

                  <div className="finished__actions">
                    <button onClick={() => activeDeckKey && startGame(activeDeckKey)} className="button">
                      Play again
                    </button>
                  </div>
                </section>
              )}

              {activeDeckKey && (
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
                                  <>
                                    ✅
                                  </>
                                ) : (
                                  <>
                                     — You Chose:{" "}
                                    <strong>{h.chosen}</strong> ❌
                                  </>
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
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App;
