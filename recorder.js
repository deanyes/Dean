// 录音机类
class VoiceRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordings = [];
        this.isRecording = false;
        this.isPaused = false;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.timerInterval = null;
        this.currentAudio = null;
        this.audioContext = null;
        this.analyser = null;
        this.animationId = null;

        this.initElements();
        this.initEventListeners();
        this.loadRecordings();
    }

    initElements() {
        // 按钮
        this.recordBtn = document.getElementById('recordBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');

        // 显示元素
        this.displayTime = document.getElementById('displayTime');
        this.displayStatus = document.getElementById('displayStatus');
        this.levelBar = document.getElementById('levelBar');
        this.recordingsList = document.getElementById('recordingsList');

        // 磁带转轮
        this.reelLeft = document.querySelector('.reel-left');
        this.reelRight = document.querySelector('.reel-right');
        this.tapeLine = document.querySelector('.tape-line');

        // VU表
        this.vuBars = document.querySelectorAll('.vu-bar');

        // 初始状态
        this.stopBtn.disabled = true;
        this.pauseBtn.disabled = true;
        this.playBtn.disabled = true;
    }

    initEventListeners() {
        this.recordBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => this.stopRecording());
        this.playBtn.addEventListener('click', () => this.playLastRecording());
        this.pauseBtn.addEventListener('click', () => this.pauseRecording());

        // 风格切换
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTheme(e.target.closest('.theme-btn')));
        });
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            // 设置音频分析器
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);
            this.analyser.fftSize = 256;

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.saveRecording(audioBlob);
                stream.getTracks().forEach(track => track.stop());
                this.stopVisualizer();
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.isPaused = false;
            this.startTime = Date.now();
            this.startTimer();
            this.startVisualizer();

            // 更新UI
            this.updateStatus('RECORDING');
            this.recordBtn.classList.add('active');
            this.recordBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.pauseBtn.disabled = false;
            this.playBtn.disabled = true;

            // 启动磁带动画
            this.reelLeft.classList.add('spinning');
            this.reelRight.classList.add('spinning');
            this.animateTape();

        } catch (error) {
            console.error('录音失败:', error);
            this.updateStatus('ERROR');
            alert('无法访问麦克风，请检查权限设置');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.isPaused = false;
            this.stopTimer();

            // 更新UI
            this.updateStatus('READY');
            this.recordBtn.classList.remove('active');
            this.recordBtn.disabled = false;
            this.stopBtn.disabled = true;
            this.pauseBtn.disabled = true;
            this.playBtn.disabled = false;

            // 停止磁带动画
            this.reelLeft.classList.remove('spinning');
            this.reelRight.classList.remove('spinning');
            this.tapeLine.style.width = '0%';
        }
    }

    pauseRecording() {
        if (this.mediaRecorder && this.isRecording) {
            if (this.isPaused) {
                this.mediaRecorder.resume();
                this.isPaused = false;
                this.startTime = Date.now() - this.elapsedTime;
                this.startTimer();
                this.updateStatus('RECORDING');
                this.reelLeft.classList.add('spinning');
                this.reelRight.classList.add('spinning');
            } else {
                this.mediaRecorder.pause();
                this.isPaused = true;
                this.stopTimer();
                this.updateStatus('PAUSED');
                this.reelLeft.classList.remove('spinning');
                this.reelRight.classList.remove('spinning');
            }
        }
    }

    playLastRecording() {
        if (this.recordings.length > 0) {
            const lastRecording = this.recordings[this.recordings.length - 1];
            this.playRecording(lastRecording.url);
        }
    }

    playRecording(url) {
        if (this.currentAudio) {
            this.currentAudio.pause();
        }

        this.currentAudio = new Audio(url);
        this.currentAudio.play();

        this.updateStatus('PLAYING');
        this.reelLeft.classList.add('spinning');
        this.reelRight.classList.add('spinning');

        this.currentAudio.onended = () => {
            this.updateStatus('READY');
            this.reelLeft.classList.remove('spinning');
            this.reelRight.classList.remove('spinning');
        };
    }

    saveRecording(blob) {
        const url = URL.createObjectURL(blob);
        const timestamp = new Date();
        const name = `录音 ${timestamp.toLocaleString('zh-CN')}`;
        const duration = this.formatTime(Math.floor(this.elapsedTime / 1000));

        const recording = {
            id: Date.now(),
            name,
            url,
            blob,
            duration,
            timestamp
        };

        this.recordings.push(recording);
        this.saveToLocalStorage();
        this.renderRecordings();
        this.resetTimer();
    }

    deleteRecording(id) {
        const index = this.recordings.findIndex(r => r.id === id);
        if (index !== -1) {
            URL.revokeObjectURL(this.recordings[index].url);
            this.recordings.splice(index, 1);
            this.saveToLocalStorage();
            this.renderRecordings();
        }
    }

    downloadRecording(id) {
        const recording = this.recordings.find(r => r.id === id);
        if (recording) {
            const a = document.createElement('a');
            a.href = recording.url;
            a.download = `${recording.name}.wav`;
            a.click();
        }
    }

    renderRecordings() {
        if (this.recordings.length === 0) {
            this.recordingsList.innerHTML = '<div class="empty-state">暂无录音</div>';
            return;
        }

        this.recordingsList.innerHTML = this.recordings.map(recording => `
            <div class="recording-item">
                <div class="recording-info">
                    <div class="recording-name">${recording.name}</div>
                    <div class="recording-duration">${recording.duration}</div>
                </div>
                <div class="recording-actions">
                    <button class="action-btn" onclick="recorder.playRecording('${recording.url}')" title="播放">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                    <button class="action-btn" onclick="recorder.downloadRecording(${recording.id})" title="下载">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                        </svg>
                    </button>
                    <button class="action-btn" onclick="recorder.deleteRecording(${recording.id})" title="删除">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.elapsedTime = Date.now() - this.startTime;
            const seconds = Math.floor(this.elapsedTime / 1000);
            this.displayTime.textContent = this.formatTime(seconds);
        }, 100);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    resetTimer() {
        this.elapsedTime = 0;
        this.displayTime.textContent = '00:00';
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    updateStatus(status) {
        this.displayStatus.textContent = status;
    }

    startVisualizer() {
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const visualize = () => {
            if (!this.isRecording) return;

            this.analyser.getByteFrequencyData(dataArray);

            // 计算平均音量
            const average = dataArray.reduce((a, b) => a + b) / bufferLength;
            const level = (average / 255) * 100;

            // 更新电平条
            this.levelBar.style.width = level + '%';

            // 更新VU表
            const activeBarCount = Math.floor((level / 100) * this.vuBars.length);
            this.vuBars.forEach((bar, index) => {
                if (index < activeBarCount) {
                    bar.classList.add('active');
                } else {
                    bar.classList.remove('active');
                }
            });

            this.animationId = requestAnimationFrame(visualize);
        };

        visualize();
    }

    stopVisualizer() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.levelBar.style.width = '0%';
        this.vuBars.forEach(bar => bar.classList.remove('active'));
    }

    animateTape() {
        if (!this.isRecording || this.isPaused) return;

        const currentWidth = parseFloat(this.tapeLine.style.width) || 0;
        if (currentWidth < 100) {
            this.tapeLine.style.width = (currentWidth + 0.1) + '%';
        }

        if (this.isRecording) {
            requestAnimationFrame(() => this.animateTape());
        }
    }

    switchTheme(btn) {
        const theme = btn.dataset.theme;
        const recorder = document.getElementById('recorder');

        // 更新活动按钮
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // 切换主题
        recorder.dataset.theme = theme;

        // 保存主题偏好
        localStorage.setItem('recorderTheme', theme);
    }

    saveToLocalStorage() {
        // 由于Blob无法直接存储到localStorage，这里只保存基本信息
        // 实际应用中可以考虑使用IndexedDB
        const recordingsData = this.recordings.map(r => ({
            id: r.id,
            name: r.name,
            duration: r.duration,
            timestamp: r.timestamp
        }));
        localStorage.setItem('recordings', JSON.stringify(recordingsData));
    }

    loadRecordings() {
        // 加载主题偏好
        const savedTheme = localStorage.getItem('recorderTheme');
        if (savedTheme) {
            const themeBtn = document.querySelector(`[data-theme="${savedTheme}"]`);
            if (themeBtn) {
                this.switchTheme(themeBtn);
            }
        }

        // 注意：录音数据在页面刷新后会丢失
        // 要实现持久化需要使用IndexedDB
        this.renderRecordings();
    }
}

// 初始化录音机
let recorder;

document.addEventListener('DOMContentLoaded', () => {
    recorder = new VoiceRecorder();
});
