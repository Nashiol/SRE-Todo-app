class ProgressBar {
  constructor() {
    this.progressFill = document.getElementById('progressFill');
    this.progressPercent = document.getElementById('progressPercent');
  }

  update(completed, total) {
    if (total === 0) {
      this.progressFill.style.width = '0%';
      this.progressPercent.textContent = '0%';
      return;
    }

    const percent = Math.round((completed / total) * 100);
    this.progressFill.style.width = `${percent}%`;
    this.progressPercent.textContent = `${percent}%`;
  }
}

const progressBar = new ProgressBar();
