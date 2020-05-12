import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from "@angular/core";
import BigNumber from "bignumber.js";

import { WalletService } from "src/app/services/wallet.service";
import { Wallet } from "src/app/types/wallet";
import { NgForm } from "@angular/forms";
import { StakingListComponent } from "../staking-list/staking-list.component";
import { TransferListComponent } from "../transfer-list/transfer-list.component";

export interface FundSent {
  walletId: string;
  amount: BigNumber;
  toAddress: string;
}
enum Status {
  PREPARING = "PREPARING",
  CONFIRMING = "CONFIRMING",
  SENDING = "SENDING",
  BROADCASTED = "BROADCASTED",
  SENT = "SENT",
}
@Component({
  selector: "app-create-address-form",
  templateUrl: "./create-address-form.component.html",
  styleUrls: ["./create-address-form.component.scss"],
})
export class CreateAddressFormComponent implements OnInit {
  walletList: Wallet[];

  @Input() walletId: string;
  walletPassphrase: string;
  walletEnckey: string;
  @ViewChild("StakingAddresses")
  stakingAddresses: StakingListComponent;
  @ViewChild("TransferAddresses")
  transferAddresses: TransferListComponent;
  @Output() cancelled = new EventEmitter<void>();

  constructor(private walletService: WalletService) {}

  ngOnInit() {
    this.walletService.loadFromLocal();
    this.walletPassphrase = this.walletService.walletPassphrase;
    this.walletEnckey = this.walletService.walletEnckey;
  }

  async handleStakingAddress(form: NgForm) {
    console.log("create staking address");
    var data = await this.walletService
      .createStakingAddress(
        this.walletId,
        this.walletPassphrase,
        this.walletEnckey
      )
      .toPromise();
    console.log(`staking result ${JSON.stringify(data)}`);
    this.stakingAddresses.refresh();
  }

  async handleTransferAddress(form: NgForm) {
    console.log("create transfer address");
    var data = await this.walletService
      .createTransferAddress(
        this.walletId,
        this.walletPassphrase,
        this.walletEnckey
      )
      .toPromise();
    console.log(`transfer result ${JSON.stringify(data)}`);
    this.transferAddresses.refresh();
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
