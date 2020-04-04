import { Component, OnInit, EventEmitter, Output } from "@angular/core";
import { NgForm } from "@angular/forms";


import { WalletService } from "src/app/services/wallet.service";
@Component({
  selector: "app-create-wallet-form",
  templateUrl: "./create-wallet-form.component.html",
  styleUrls: ["./create-wallet-form.component.scss"]
})
export class CreateWalletFormComponent implements OnInit {
  @Output() cancelled = new EventEmitter<void>();
  @Output() created = new EventEmitter<string>();
  duplicatedWalletId = false;
  walletId: string;
  constructor(private walletService: WalletService) {}

  ngOnInit() {}

  handleSubmit(form: NgForm): void {
    console.log("handle submit");
    this.markFormAsDirty(form);
    if (form.valid) {

      this.createWallet(form.value.walletId, form.value.walletPassphrase, form.value.walletMnemonics);
    }
    else  {
      console.log("form not valid");
    }
  }

  markFormAsDirty(form: NgForm) {
    Object.keys(form.controls).forEach(field => {
      form.controls[field].markAsDirty();
    });
  }

  createWallet(id: string, passphrase: string, mnemonics:string): void {
    console.log("create wallet");
    this.walletService.addWallet(id, passphrase,mnemonics).subscribe(
      (a) => {
        var content= JSON.stringify(a);
        console.log("recieved=%s", content);
        this.walletService.syncWalletList();

        if (a["result"]) {
          if (mnemonics!=undefined && mnemonics.length>0) {
            let viewkey= a["result"];
            localStorage.setItem(`${id}_viewkey`, viewkey);
            alert("viewkey= "+viewkey);

          }
          else {
            let viewkey= a["result"][0];
            localStorage.setItem(`${id}_viewkey`, viewkey);
            let mnemonics= a["result"][1];
            alert("viewkey= "+viewkey+"  mnemonics= "+mnemonics);


          }
        }
        else {
          alert("error= "+ a["error"]["message"]);
        }

        

        this.created.emit(id);
      },
      error => {
        this.duplicatedWalletId = true;
      }
    );
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
