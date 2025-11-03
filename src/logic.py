from typing import Literal


Result = Literal["high", "low", "correct"]


def compare_guess(answer: int, guess: int) -> Result:

	if guess > answer:
		return "high"
	if guess < answer:
		return "low"
	return "correct"


