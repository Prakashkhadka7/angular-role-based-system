import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleDeleteConfirm } from './role-delete-confirm';

describe('RoleDeleteConfirm', () => {
  let component: RoleDeleteConfirm;
  let fixture: ComponentFixture<RoleDeleteConfirm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleDeleteConfirm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoleDeleteConfirm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
