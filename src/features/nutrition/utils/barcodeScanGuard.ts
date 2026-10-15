export class BarcodeScanGuard {
  private inProgress = false;

  acquire(): boolean {
    if (this.inProgress) return false;
    this.inProgress = true;
    return true;
  }

  release(): void {
    this.inProgress = false;
  }
}
