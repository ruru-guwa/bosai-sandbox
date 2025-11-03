(() => {
	'use strict';

	const input = document.getElementById('guess');
	const submit = document.getElementById('submit');
	const reset = document.getElementById('reset');
	const message = document.getElementById('message');

	let answer = randomInt(1, 20);

	function randomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	function setMessage(text, cls) {
		message.textContent = text;
		message.className = `message ${cls ?? ''}`.trim();
	}

	function handleSubmit() {
		const raw = input.value.trim();
		const num = Number(raw);
		if (!raw || Number.isNaN(num) || !Number.isInteger(num)) {
			setMessage('無効な入力です。1〜20の整数を入力してください。', 'warn');
			return;
		}
		if (num < 1 || num > 20) {
			setMessage('範囲外です。1〜20の整数を入力してください。', 'warn');
			return;
		}
		if (num > answer) {
			setMessage('高すぎ', 'bad');
			return;
		}
		if (num < answer) {
			setMessage('低すぎ', 'bad');
			return;
		}
		setMessage('正解！', 'ok');
		submit.disabled = true;
		input.disabled = true;
	}

	function handleReset() {
		answer = randomInt(1, 20);
		input.value = '';
		input.disabled = false;
		submit.disabled = false;
		setMessage('ゲームをリセットしました。1〜20の整数を入力してください。');
		input.focus();
	}

	submit.addEventListener('click', handleSubmit);
	reset.addEventListener('click', handleReset);
	input.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') handleSubmit();
	});

	setMessage('1〜20の整数を入力して「判定」を押してください。');
	input.focus();
})();


