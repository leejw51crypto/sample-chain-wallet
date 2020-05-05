import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { AngularFontAwesomeComponent } from "angular-font-awesome";

import { WithdrawFundsFormComponent } from "./withdraw-funds-form.component";
import { SufficientBalanceValidatorDirective } from "./sufficient-balance.directive";
import { AddressValidatorDirective } from "src/app/shared/address.directive";

describe("WithdrawFundsFormComponent", () => {
  let component: WithdrawFundsFormComponent;
  let fixture: ComponentFixture<WithdrawFundsFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        WithdrawFundsFormComponent,
        AngularFontAwesomeComponent,
        AddressValidatorDirective,
        SufficientBalanceValidatorDirective,
      ],
      imports: [FormsModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WithdrawFundsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
