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
  @Input() walletBalance: string;
  @Input() amount: BigNumber;
  amountValue: string;
  @Input() toAddress: string;
  @Input() viewKey: string;
  walletPassphrase: string;
  walletEnckey: string;
  senderViewKey: string;
  @ViewChild("StakingAddresses")
  stakingAddresses: StakingListComponent;

  @ViewChild("TransferAddresses")
  transferAddresses: TransferListComponent;

  @Output() sent = new EventEmitter<FundSent>();
  @Output() cancelled = new EventEmitter<void>();

  private status: Status = Status.PREPARING;
  private walletBalanceBeforeSend = "";
  private sendToAddressApiError = false;

  constructor(private walletService: WalletService) {}

  ngOnInit() {
    this.walletService.loadFromLocal();
    this.walletPassphrase = this.walletService.walletPassphrase;
    this.walletEnckey = this.walletService.walletEnckey;

    this.viewKey = this.walletService.sendViewkey;
    this.toAddress = this.walletService.sendToAddressString;
    this.amountValue = this.walletService.sendAmount;

    this.walletService
      .getWalletViewKey()
      .subscribe((walletViewKey) => (this.senderViewKey = walletViewKey));

    if (this.amount) {
      this.amountValue = this.amount.toString(10);
    }
    this.walletService.getWalletBalance().subscribe((balance) => {
      this.walletBalance = balance;
    });
  }

  handleAmountChange(amount: string): void {
    this.amount = new BigNumber(amount);
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

  handleConfirm(form: NgForm): void {
    this.walletPassphrase = form.value.walletPassphrase;

    this.markFormAsDirty(form);
    this.sendToAddressApiError = false;
    if (form.valid) {
      this.confirm();
    }
  }

  confirm(): void {
    this.walletService.sendViewkey = this.viewKey;
    this.walletService.sendToAddressString = this.toAddress;
    this.walletService.sendAmount = this.amountValue;
    this.walletService.saveToLocal();
    this.status = Status.CONFIRMING;
  }

  handleSend(form: NgForm): void {
    this.send();
  }

  markFormAsDirty(form: NgForm) {
    Object.keys(form.controls).forEach((field) => {
      form.controls[field].markAsDirty();
    });
  }

  async send() {
    this.walletBalanceBeforeSend = this.walletBalance;
    this.status = Status.SENDING;
    const amountInBasicUnit = new BigNumber(this.amountValue)
      .multipliedBy("100000000")
      .toString(10);

    this.walletEnckey = (
      await this.walletService.checkWalletEncKey(
        this.walletId,
        this.walletPassphrase
      )
    )["result"];

    this.walletService
      .sendToAddress(
        this.walletId,
        this.walletPassphrase,
        this.walletEnckey,
        this.toAddress,
        amountInBasicUnit,
        [this.senderViewKey, this.viewKey]
      )
      .subscribe((data) => {
        if (data["error"]) {
          this.status = Status.PREPARING;
          // TODO: Distinguish from insufficient balance?
          this.sendToAddressApiError = true;
        } else {
          setTimeout(() => {
            this.checkTxAlreadySent();
          }, 3000);
        }
      });
  }

  async checkTxAlreadySent() {
    // TODO: Should use more reliable way to check for transaction confirmed
    var _data = await this.walletService.decrypt(
      this.walletPassphrase,
      this.walletEnckey
    );

    if (this.walletBalance === this.walletBalanceBeforeSend) {
      this.status = Status.BROADCASTED;
    } else {
      this.status = Status.SENT;
    }
  }

  closeAfterSend(): void {
    this.sent.emit({
      walletId: this.walletId,
      amount: this.amount,
      toAddress: this.toAddress,
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
