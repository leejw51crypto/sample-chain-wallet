import { Component, OnInit, EventEmitter, Output } from "@angular/core";
import { NgForm } from "@angular/forms";

import { WalletService } from "src/app/services/wallet.service";

@Component({
  selector: "app-passphrase-form",
  templateUrl: "./passphrase-form.component.html",
  styleUrls: ["./passphrase-form.component.scss"],
})
export class PassphraseFormComponent implements OnInit {
  @Output() cancelled = new EventEmitter<void>();
  @Output() created = new EventEmitter<string>();
  duplicatedWalletId = false;
  currentWalletId: string;
  walletPassphrase: string;
  walletEnckey: string;
  errorMsgFlag = false;
  constructor(private walletService: WalletService) {}

  ngOnInit() {
    this.walletService.getSelectedWallet().subscribe((selectedWallet) => {
      this.currentWalletId = selectedWallet.id;
      console.log(`current wallet=${this.currentWalletId}`);
    });

    this.walletPassphrase = this.walletService.walletPassphrase;
    this.walletEnckey = this.walletService.walletEnckey;

    setTimeout(() => {
      document.getElementById("walletPassphrase").focus();
    });
  }

  async sync(passphrase: string, enckey: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.walletService.decrypt(passphrase, enckey).subscribe((decrypted) => {
        // can be called multiple, because it's BehaviourSubject
        if (decrypted != null) {
          resolve(decrypted);
        }
      });
    });
  }

  async handleSubmit(form: NgForm): Promise<void> {
    this.walletPassphrase = form.value.walletPassphrase;

    let walletid = this.currentWalletId;

    this.walletPassphrase = form.value.walletPassphrase;

    this.walletEnckey = (
      await this.walletService.checkWalletEncKey(
        walletid,
        this.walletPassphrase
      )
    )["result"];

    // cache data
    this.walletService.walletPassphrase = this.walletPassphrase;
    this.walletService.walletEnckey = this.walletEnckey;

    let decrypted = await this.sync(this.walletPassphrase, this.walletEnckey);

    if (decrypted === true) {
      this.created.emit();
    } else if (decrypted === false) {
      this.errorMsgFlag = true;
    }
  }

  cancel(): void {
    this.walletService.selectWalletById("");
    this.cancelled.emit();
  }
}
