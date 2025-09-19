import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSectionsComponent } from './sections.component';

describe('SectionsComponent', () => {
  let component: AdminSectionsComponent;
  let fixture: ComponentFixture<AdminSectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSectionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminSectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
