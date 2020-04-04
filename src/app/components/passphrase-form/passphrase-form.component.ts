import { Component, OnInit, EventEmitter, Output } from "@angular/core";
import { NgForm } from "@angular/forms";

import { WalletService } from "src/app/services/wallet.service";

@Component({
  selector: "app-passphrase-form",
  templateUrl: "./passphrase-form.component.html",
  styleUrls: ["./passphrase-form.component.scss"]
})
export class PassphraseFormComponent implements OnInit {
  @Output() cancelled = new EventEmitter<void>();
  @Output() created = new EventEmitter<string>();
  duplicatedWalletId = false;
  walletId: string;
  errorMsgFlag = false;
  constructor(private walletService: WalletService) {}

  ngOnInit() {
    setTimeout(() => {
      document.getElementById("walletPassphrase").focus();
    });
  }

  handleSubmit(form: NgForm): void {
    console.log("handleSubmit %s",JSON.stringify(form.value));                                                                 
    console.log("%s %s",form.value.walletPassphrase, form.value.walletEnckey);
    this.walletService
      .decrypt(form.value.walletPassphrase, form.value.walletEnckey)
                                            
      .subscribe(decrypted => {
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
