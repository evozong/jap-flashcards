import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Card = {
  hiragana: string;
  romaji: string;
};

// A compact (but useful) set of hiragana. Add more if you like.
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
  const ROUND_SIZE = 10;

  // prepare a deck for the round (10 unique cards)
  const [deck, setDeck] = useState<Card[]>(() => pickN(HIRAGANA, ROUND_SIZE));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [history, setHistory] = useState<{ card: Card; chosen: string; correct: boolean }[]>([]);

  // regenerate deck when user clicks 'New Game'
  const newGame = () => {
    setDeck(pickN(HIRAGANA, ROUND_SIZE));
    setIndex(0);
    setScore(0);
    setSelected(null);
    setShowAnswer(false);
    setHistory([]);
  };

  const current = deck[index];

  // memoize choices for current card so they don't change while user decides
  const choices = useMemo(() => (current ? makeChoices(HIRAGANA, current) : []), [current]);

  const handleChoose = (choice: string) => {
    if (showAnswer) return; // prevent re-selection
    setSelected(choice);
    const correct = choice === current.romaji;
    if (correct) setScore((s) => s + 1);
    setHistory((h) => [...h, { card: current, chosen: choice, correct }]);
    setShowAnswer(true);
  };

  const next = () => {
    setSelected(null);
    setShowAnswer(false);
    setIndex((i) => i + 1);
  };

  const isFinished = index >= deck.length;

  useEffect(() => {
    // if user reaches end, index === deck.length triggers finished state
    if (index >= deck.length) {
      // nothing else for now
    }
  }, [index, deck.length]);

  return (
<>
	<div style={{ fontFamily: "Inter, Roboto, system-ui, -apple-system, 'Segoe UI', Arial", padding: 20 }}>
		<header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
			<h1 style={{ margin: 0 }}>Hiragana Flashcards</h1>
			<div>
				<strong>Round</strong> {Math.min(index + 1, deck.length)}/{deck.length}
				<span style={{ marginLeft: 12 }}>
					<strong>Score</strong> {score}
				</span>
				<button style={{ marginLeft: 12, padding: "6px 10px" }} onClick={newGame}>
					New Game
				</button>
			</div>
		</header>

		{!isFinished && current && (
			<main>
				<section style={{ textAlign: "center", marginBottom: 16 }}>
					<div style={{ fontSize: 96 }}>{current.hiragana}</div>
					<div style={{ color: "#666", marginTop: 8 }}>What is the romaji for this hiragana?</div>
				</section>

				<section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
					{choices.map((c) => {
						const isCorrect = c === current.romaji;
						const isSelected = c === selected;

						let background = "white";
						if (showAnswer && isCorrect) background = "#daf7dc"; // green-ish
						else if (isSelected && showAnswer && !isCorrect) background = "#ffdede"; // red-ish

						return (
							<button
								key={c}
								onClick={() => handleChoose(c)}
								disabled={showAnswer}
								style={{
									padding: 12,
									fontSize: 18,
									borderRadius: 8,
									border: "1px solid #ddd",
									background,
									cursor: showAnswer ? "default" : "pointer"
								}}
							>
								{c}
							</button>
						);
					})}
				</section>

				<div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<div>
						{showAnswer && (
							<div>
								{selected === current.romaji ? (
									<div style={{ color: "green" }}>Correct! ✅</div>
								) : (
									<div style={{ color: "#b00020" }}>Incorrect — correct answer: {current.romaji}</div>
								)}
							</div>
						)}
					</div>

					<div>
						<button
							onClick={() => {
								// reveal answer (mark incorrect if not selected)
								if (!showAnswer) {
									// record an incorrect choice if nothing selected
									if (!selected) {
										setHistory((h) => [...h, { card: current, chosen: "", correct: false }]);
										setShowAnswer(true);
									}
								}
							}}
							style={{ marginRight: 8, padding: "8px 12px" }}
						>
							Reveal Answer
						</button>

						<button onClick={next} disabled={!showAnswer} style={{ padding: "8px 12px" }}>
							{index + 1 >= deck.length ? "Finish" : "Next"}
						</button>
					</div>
				</div>
			</main>
		)}

		{isFinished && (
			<section style={{ marginTop: 24 }}>
				<h2>Round complete</h2>
				<p>
					You scored <strong>{score}</strong> out of <strong>{deck.length}</strong>.
				</p>

				<div style={{ marginTop: 12 }}>
					<button onClick={newGame} style={{ padding: "8px 12px", marginRight: 8 }}>
						Play again
					</button>
				</div>

				<details style={{ marginTop: 16 }}>
					<summary>Review answers</summary>
					<ol>
						{history.map((h, i) => (
							<li key={i} style={{ margin: "8px 0" }}>
								<span style={{ fontSize: 20, marginRight: 8 }}>{h.card.hiragana}</span>
								<span>
									Chosen: <strong>{h.chosen || "(no answer)"}</strong> — Correct: <strong>{h.card.romaji}</strong>
									{h.correct ? " ✅" : " ❌"}
								</span>
							</li>
						))}
					</ol>
				</details>
			</section>
		)}

		<footer style={{ marginTop: 36, color: "#666" }}>
			Tip: you can edit the HIRAGANA array in src/App.tsx to add dakuten (e.g. が, ぎ) or more kana.
		</footer>
	</div>
</>
  )
}

export default App;
