(() => {
	'use strict';

	const input = document.getElementById('guess');
	const submit = document.getElementById('submit');
	const reset = document.getElementById('reset');
	const message = document.getElementById('message');
	const tip = document.getElementById('tip');
	const attemptsEl = document.getElementById('attempts');
	const bestEl = document.getElementById('best');
	const moodEl = document.getElementById('mood');
	const historyEl = document.getElementById('history');
	const confetti = document.getElementById('confetti');
	const celebration = document.getElementById('celebration');
	const celebrationText = celebration?.querySelector('.celebration-text');

	const tips = [
		'スピード勝負！何回で当てられる？',
		'直感を信じてみよう。',
		'少しずつ範囲を絞っていくのがコツ。',
		'ハイ＆ロー戦略で攻めてみて！',
		'1〜20の真ん中は10。そこから探検だ！',
		'ラッキーナンバーが降ってくるかも…？'
	];
	const tooHighMessages = [
		'高すぎ 😢 もう少し控えめな数字で！',
		'高いね！風船が割れちゃう！ 😭',
		'うーん、その高さは天空の彼方……もう少し下を探って！'
	];
	const tooLowMessages = [
		'低すぎ 😢 もっと冒険してみよう！',
		'ちょっと低いかな？勇気を出して上を目指そう！ 😭',
		'地下深く掘りすぎた！もう少し上を狙おう！'
	];
	const closeCheers = ['あと少し！🔥', 'ナイス勘！✨', 'カウントダウン中…！⏳'];
	const danceMessages = [
		'やったね！ダンスパーティー！💃',
		'勝利の舞を披露中！🕺✨',
		'みんなでお祝いダンス！🎶',
		'完璧！ステップもキレッキレ！💥',
		'君の勝利に拍手喝采！👏'
	];

	let answer = randomInt(1, 20);
	let attempts = 0;
	let bestRecord = loadBest();

	function randomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	function randomItem(list) {
		return list[Math.floor(Math.random() * list.length)];
	}

	function setMessage(text, cls) {
		message.textContent = text;
		message.className = `message ${cls ?? ''}`.trim();
	}

	function updateStatus() {
		attemptsEl.textContent = attempts.toString();
		bestEl.textContent = bestRecord ? `${bestRecord}回` : '--';
	}

	function setMood(emoji) {
		moodEl.textContent = emoji;
	}

	function addHistory(guess, feedback) {
		const li = document.createElement('li');
		const guessSpan = document.createElement('span');
		guessSpan.className = 'guess';
		guessSpan.textContent = `🎯 ${guess}`;
		const feedbackSpan = document.createElement('span');
		feedbackSpan.className = 'feedback';
		feedbackSpan.textContent = feedback;
		li.append(guessSpan, feedbackSpan);
		historyEl.prepend(li);
		while (historyEl.children.length > 6) {
			historyEl.lastElementChild?.remove();
		}
	}

	function fireConfetti() {
		const colors = ['#facc15', '#22c55e', '#60a5fa', '#f472b6', '#f97316', '#a855f7'];
		const emojis = ['🎉', '✨', '🎊', '💫', '🌟'];
		const total = 220;
		for (let i = 0; i < total; i += 1) {
			const piece = document.createElement('span');
			piece.className = 'confetti-piece';
			const core = document.createElement('span');
			core.className = 'core';
			const color = colors[Math.floor(Math.random() * colors.length)];
			const isEmoji = Math.random() < 0.12;
			const size = isEmoji ? 24 + Math.random() * 12 : 12 + Math.random() * 10;
			const shape = Math.random();
			piece.style.setProperty('--color', color);
			piece.style.setProperty('--size', `${size}px`);
			piece.style.setProperty('--size-y', `${isEmoji ? size : size * (0.6 + Math.random() * 0.8)}px`);
			piece.style.setProperty('--radius', shape > 0.7 ? '50%' : shape > 0.4 ? '2px' : '6px');
			piece.style.setProperty('--offset-x', `${Math.random() * 160 - 80}vw`);
			piece.style.setProperty('--drift', `${Math.random() * 60 - 30}vw`);
			piece.style.setProperty('--duration', `${2.6 + Math.random() * 1.8}s`);
			piece.style.setProperty('--spin', `${0.8 + Math.random() * 0.6}s`);
			piece.style.setProperty('--delay', `${Math.random() * 0.8}s`);
			if (isEmoji) {
				core.textContent = emojis[Math.floor(Math.random() * emojis.length)];
				piece.style.setProperty('--emoji-size', `${size}px`);
				piece.style.setProperty('--emoji-color', '#fff');
				core.style.background = 'transparent';
			} else {
				core.textContent = '';
				core.style.background = color;
			}
			piece.appendChild(core);
			confetti.appendChild(piece);
			setTimeout(() => piece.remove(), 4000);
		}
	}

	function loadBest() {
		const raw = localStorage.getItem('number-guess-best');
		const record = raw ? Number(raw) : null;
		return Number.isFinite(record) && record > 0 ? record : null;
	}

	function saveBest(value) {
		bestRecord = value;
		localStorage.setItem('number-guess-best', String(value));
		updateStatus();
	}

	function updateTip() {
		tip.textContent = randomItem(tips);
	}

	function resetGame() {
		answer = randomInt(1, 20);
		attempts = 0;
		input.value = '';
		input.disabled = false;
		submit.disabled = false;
		setMessage('ゲームをリセットしました。1〜20の整数を入力してください。', 'warn');
		historyEl.innerHTML = '';
		setMood('😊');
		updateStatus();
		updateTip();
		confetti.innerHTML = '';
		celebration?.classList.remove('show');
		input.focus();
	}

	function handleSubmit() {
		const raw = input.value.trim();
		const num = Number(raw);
		if (!raw || Number.isNaN(num) || !Number.isInteger(num)) {
			setMessage('無効な入力です。1〜20の整数を入力してください。', 'warn');
			setMood('🤨');
			return;
		}
		if (num < 1 || num > 20) {
			setMessage('範囲外です。1〜20の整数を入力してください。', 'warn');
			setMood('🙈');
			return;
		}

		attempts += 1;
		updateStatus();

		if (num > answer) {
			const feedback = randomItem(tooHighMessages);
			setMessage(feedback, 'bad');
			setMood(num - answer === 1 ? '🔥' : '😅');
			addHistory(num, feedback);
			return;
		}
		if (num < answer) {
			const feedback = randomItem(tooLowMessages);
			setMessage(feedback, 'bad');
			setMood(answer - num === 1 ? '🔥' : '🤔');
			addHistory(num, feedback);
			return;
		}

		const cheer = randomItem(closeCheers);
		setMessage(`正解！😊 ${cheer}`, 'ok');
		setMood('🎉');
		addHistory(num, 'バッチリ命中！🏆');
		submit.disabled = true;
		input.disabled = true;
		fireConfetti();
		celebration?.classList.add('show');
		if (celebrationText) {
			celebrationText.textContent = randomItem(danceMessages);
		}
		if (!bestRecord || attempts < bestRecord) {
			saveBest(attempts);
		}
	}

	submit.addEventListener('click', handleSubmit);
	reset.addEventListener('click', resetGame);
	input.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') handleSubmit();
	});

	updateTip();
	updateStatus();
	setMessage('1〜20の整数を入力して「判定」を押してください。', 'warn');
	input.focus();
})();


