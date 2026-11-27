import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { RouterLink } from '@angular/router';
import { ApiService } from './core/api.service';
import { Todo } from './core/models';

@Component({
  standalone: true,
  selector: 'app-review-queue',
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './review-queue.component.html'
})
export class ReviewQueueComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);

  readonly tasks = signal<Todo[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  private changesSubscription?: Subscription;

  ngOnInit(): void {
    this.load();
    this.changesSubscription = this.api.todoChanged$.subscribe(() => this.load());
  }

  ngOnDestroy(): void {
    this.changesSubscription?.unsubscribe();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.api.reviewQueue(1, 100).subscribe({
      next: response => {
        this.tasks.set(response.data || []);
        this.loading.set(false);
      },
      error: error => {
        this.error.set(error.error?.message || 'Could not load review queue.');
        this.loading.set(false);
      }
    });
  }

  ownerName(todo: Todo): string {
    const owner = todo.userId;
    return typeof owner === 'string'
      ? 'Task owner'
      : owner.fname + ' ' + owner.lname;
  }
}
