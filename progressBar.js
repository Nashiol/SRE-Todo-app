const ProgressBar = {
  init() {
    this.fill = document.getElementById('progressFill');
    this.percent = document.getElementById('progressPercent');
  },

  update(total, completed) {
    if (!this.fill || !this.percent) this.init();

    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    this.fill.style.width = `${percentage}%`;
    this.percent.textContent = `${percentage}%`;

    // Shift gradient colour as progress grows
    if (percentage === 100) {
      this.fill.style.background = 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
    } else if (percentage >= 50) {
      this.fill.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    } else {
      this.fill.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  }
};
