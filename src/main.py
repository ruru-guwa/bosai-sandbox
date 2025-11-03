import random

from .logic import compare_guess


def read_int(prompt: str) -> int:

	while True:
		try:
			value = input(prompt)
			iv = int(value)
			return iv
		except ValueError:
			print("無効な入力です。1〜20の整数を入力してください。")


def main() -> None:

	print("数当てゲームへようこそ！1〜20の整数を当ててください。")
	answer = random.randint(1, 20)

	while True:
		guess = read_int("あなたの予想: ")
		if guess < 1 or guess > 20:
			print("範囲外です。1〜20の整数を入力してください。")
			continue

		result = compare_guess(answer, guess)
		if result == "high":
			print("高すぎ")
		elif result == "low":
			print("低すぎ")
		else:
			print("正解！")
			break


if __name__ == "__main__":

	main()


