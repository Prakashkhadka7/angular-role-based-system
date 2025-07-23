import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserDeleteConfirm } from './user-delete-confirm';

describe('UserDeleteConfirm', () => {
  let component: UserDeleteConfirm;
  let fixture: ComponentFixture<UserDeleteConfirm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDeleteConfirm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserDeleteConfirm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
