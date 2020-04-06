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
  walletPassphrase: string = "123";
  walletEnckey: string = "abc";
  errorMsgFlag = false;
  constructor(private walletService: WalletService) {}

  ngOnInit() {
    let walletid = localStorage.getItem("current_wallet");
    this.currentWalletId = walletid;
    console.log("passphrase box walletid=" + walletid);
    this.walletPassphrase = localStorage.getItem(`${walletid}_passphrase`);
    this.walletEnckey = localStorage.getItem(`${walletid}_enckey`);

    setTimeout(() => {
      document.getElementById("walletPassphrase").focus();
    });
  }

  handleSubmit(form: NgForm): void {
    console.log("walletid=" + this.currentWalletId);
    console.log("handleSubmit %s", JSON.stringify(form.value));
    console.log("%s %s", form.value.walletPassphrase, form.value.walletEnckey);

    this.walletPassphrase = form.value.walletPassphrase;
    this.walletEnckey = form.value.walletEnckey;
    let walletid = this.currentWalletId;
    localStorage.setItem(`${walletid}_passphrase`, this.walletPassphrase);
    localStorage.setItem(`${walletid}_enckey`, this.walletEnckey);
    console.log(`save enckey  ${walletid}_enckey    ${this.walletEnckey}`);

    this.walletService
      .decrypt(form.value.walletPassphrase, form.value.walletEnckey)

      .subscribe((decrypted) => {
        if (decrypted === true) {
          this.created.emit();
        } else if (decrypted === false) {
          this.errorMsgFlag = true;
        }
      });
  }

  cancel(): void {
    this.walletService.selectWalletById("");
    this.cancelled.emit();
  }
}
