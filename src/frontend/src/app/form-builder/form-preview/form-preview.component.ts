import { Component, Input, OnChanges, SimpleChanges, inject, signal, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { VersionService } from '../../services/version.service';
import { LookupService } from '../../services/lookup.service';
import { DirectionService } from '../../services/direction.service';
import { Field, ConditionalRule, ConditionJsonPayload, Lookup, LookupValue, SubField } from '../../models/api.models';

@Component({
  selector: 'app-form-preview',
  standalone: true,
  imports: [TranslocoPipe],
  template: `
    <div class="preview-panel">

      <!-- Header -->
      <div class="preview-header">
        <div class="preview-header-left">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
          <span class="preview-label-top">{{ 'preview.label' | transloco }}</span>
        </div>
        <button class="btn-secondary btn-sm" (click)="reload()">{{ 'preview.refresh' | transloco }}</button>
      </div>

      <!-- Form shell -->
      <div class="preview-body">
        @if (formTitle) {
          <h2 class="preview-form-title">{{ formTitle }}</h2>
        }

        @if (loading()) {
          <p class="text-muted" style="text-align:center;padding:2rem 0">{{ 'preview.loading' | transloco }}</p>
        } @else if (visibleFields().length === 0) {
          <div class="preview-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
            </svg>
            <p>{{ 'preview.empty' | transloco }}</p>
          </div>
        } @else {
          <div class="preview-fields">
            @for (field of visibleFields(); track field.fieldId) {
              <div class="preview-field" [class.preview-field--required]="field.required">
                <label class="preview-field-label">
                  {{ fieldLabel(field) }}
                  @if (field.required) {
                    <span class="preview-required" title="Required">*</span>
                  }
                </label>

                @if (field.fieldType === 'yes_no') {
                  <div class="preview-radio-group">
                    <label class="preview-radio">
                      <input
                        type="radio"
                        [name]="'pv_' + field.fieldKey"
                        value="Yes"
                        [checked]="previewValues()[field.fieldKey] === 'Yes'"
                        (change)="onValueChange(field.fieldKey, 'Yes')"
                      />
                      <span>{{ 'common.yes' | transloco }}</span>
                    </label>
                    <label class="preview-radio">
                      <input
                        type="radio"
                        [name]="'pv_' + field.fieldKey"
                        value="No"
                        [checked]="previewValues()[field.fieldKey] === 'No'"
                        (change)="onValueChange(field.fieldKey, 'No')"
                      />
                      <span>{{ 'common.no' | transloco }}</span>
                    </label>
                  </div>
                }

                @if (field.fieldType === 'list') {
                  <select
                    [name]="'pv_' + field.fieldKey"
                    [value]="previewValues()[field.fieldKey] || ''"
                    (change)="onValueChange(field.fieldKey, $any($event.target).value)"
                  >
                    <option value="">{{ 'renderer.selectOption' | transloco }}</option>
                    @for (opt of lookupOptions(field.lookupId); track opt.lookupValueId) {
                      <option [value]="opt.value">{{ opt.value }}</option>
                    }
                  </select>
                }

                @if (field.fieldType === 'date') {
                  <input
                    type="date"
                    [name]="'pv_' + field.fieldKey"
                    [value]="previewValues()[field.fieldKey] || ''"
                    (change)="onValueChange(field.fieldKey, $any($event.target).value)"
                  />
                }

                @if (field.fieldType === 'text') {
                  <input
                    type="text"
                    [name]="'pv_' + field.fieldKey"
                    [value]="previewValues()[field.fieldKey] || ''"
                    [placeholder]="field.placeholder || field.label"
                    (input)="onValueChange(field.fieldKey, $any($event.target).value)"
                  />
                }

                @if (field.fieldType === 'number') {
                  <input
                    type="number"
                    [name]="'pv_' + field.fieldKey"
                    [value]="previewValues()[field.fieldKey] || ''"
                    [placeholder]="field.placeholder || field.label"
                    (input)="onValueChange(field.fieldKey, $any($event.target).value)"
                  />
                }

                @if (field.fieldType === 'repeater') {
                  <div class="repeater-container">
                    @if (repeaterSubFields(field).length > 0) {
                      <table class="repeater-table">
                        <thead>
                          <tr>
                            @for (sf of repeaterSubFields(field); track sf.key) {
                              <th>{{ sf.label }}</th>
                            }
                            <th style="width:2rem"></th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (row of repeaterRows(field.fieldKey); track $index; let ri = $index) {
                            <tr>
                              @for (sf of repeaterSubFields(field); track sf.key) {
                                <td>
                                  @if (sf.type === 'text') {
                                    <input class="rep-input" type="text" [value]="row[sf.key] || ''" (input)="onRepeaterCellChange(field.fieldKey, ri, sf.key, $any($event.target).value)" />
                                  }
                                  @if (sf.type === 'number') {
                                    <input class="rep-input" type="number" [value]="row[sf.key] || ''" (input)="onRepeaterCellChange(field.fieldKey, ri, sf.key, $any($event.target).value)" />
                                  }
                                  @if (sf.type === 'list') {
                                    <select class="rep-select" [value]="row[sf.key] || ''" (change)="onRepeaterCellChange(field.fieldKey, ri, sf.key, $any($event.target).value)">
                                      <option value="">—</option>
                                      @for (opt of lookupOptions(sf.lookupId ?? null); track opt.lookupValueId) {
                                        <option [value]="opt.value">{{ opt.value }}</option>
                                      }
                                    </select>
                                  }
                                  @if (sf.type === 'yes_no') {
                                    <select class="rep-select" [value]="row[sf.key] || ''" (change)="onRepeaterCellChange(field.fieldKey, ri, sf.key, $any($event.target).value)">
                                      <option value="">—</option>
                                      <option value="Yes">{{ 'common.yes' | transloco }}</option>
                                      <option value="No">{{ 'common.no' | transloco }}</option>
                                    </select>
                                  }
                                </td>
                              }
                              <td>
                                <button class="rep-remove" type="button" (click)="removeRepeaterRow(field.fieldKey, ri)" title="Remove row">✕</button>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    }
                    <button type="button" class="rep-add-btn" (click)="addRepeaterRow(field.fieldKey)">{{ 'renderer.addRow' | transloco }}</button>
                  </div>
                }
              </div>
            }
          </div>

          <div class="preview-submit-row">
            <button class="btn-primary" disabled style="opacity:0.5;cursor:default;justify-content:center;width:100%">
              {{ 'preview.submit' | transloco }}
            </button>
            <p class="preview-hint">{{ 'preview.hint' | transloco }}</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .preview-panel {
      background: var(--sf);
      border: 1px solid var(--bd);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.125rem;
      background: var(--sf2);
      border-bottom: 1px solid var(--bds);
    }

    .preview-header-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--tx4);
    }

    .preview-label-top {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--tx4);
    }

    .preview-body {
      padding: 1.5rem 1.25rem;
    }

    .preview-form-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--tx);
      margin-bottom: 1.25rem;
      padding-bottom: 0.875rem;
      border-bottom: 1px solid var(--bds);
      letter-spacing: -0.01em;
    }

    .preview-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 2.5rem 1rem;
      color: var(--tx3);
      font-size: 0.875rem;
    }

    .preview-fields {
      display: flex;
      flex-direction: column;
      gap: 1.125rem;
    }

    .preview-field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .preview-field-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--tx3);
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .preview-required {
      color: #e11d48;
      font-size: 0.9rem;
    }

    .preview-radio-group {
      display: flex;
      gap: 1.25rem;
    }

    .preview-radio {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.875rem;
      color: var(--tx3);
      cursor: pointer;
      user-select: none;
    }

    .preview-radio input[type="radio"] {
      width: 16px;
      height: 16px;
      appearance: none;
      -webkit-appearance: none;
      border: 2px solid var(--bdi);
      border-radius: 50%;
      background: var(--bg);
      cursor: pointer;
      flex-shrink: 0;
      transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
    }

    .preview-radio input[type="radio"]:checked {
      border-color: #10b981;
      background: #10b981;
      box-shadow: inset 0 0 0 3px var(--sf);
    }

    .preview-radio input[type="radio"]:focus-visible {
      outline: 2px solid rgba(16,185,129,0.4);
      outline-offset: 2px;
    }

    .preview-submit-row {
      margin-top: 1.5rem;
      padding-top: 1.125rem;
      border-top: 1px solid var(--bds);
    }

    .preview-hint {
      text-align: center;
      font-size: 0.75rem;
      color: var(--tx3);
      margin-top: 0.5rem;
    }

    .repeater-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .repeater-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }

    .repeater-table th {
      text-align: left;
      font-weight: 500;
      color: var(--tx4);
      padding: 0.25rem 0.375rem;
      border-bottom: 1px solid var(--bds);
      background: var(--sf2);
    }

    .repeater-table td {
      padding: 0.25rem 0.375rem;
      vertical-align: middle;
    }

    .rep-input, .rep-select {
      width: 100%;
      padding: 0.25rem 0.375rem;
      font-size: 0.8rem;
      border: 1px solid var(--bdi);
      border-radius: 4px;
      background: var(--bg);
      color: var(--tx);
    }

    .rep-input:focus, .rep-select:focus {
      outline: none;
      border-color: #10b981;
    }

    .rep-remove {
      background: none;
      border: none;
      color: #f87171;
      cursor: pointer;
      font-size: 0.875rem;
      padding: 0.125rem 0.25rem;
      border-radius: 4px;
      line-height: 1;
    }

    .rep-remove:hover { background: rgba(225,29,72,0.15); }

    .rep-add-btn {
      align-self: flex-start;
      background: none;
      border: 1px dashed var(--bdi);
      color: var(--tx4);
      font-size: 0.8125rem;
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      cursor: pointer;
    }

    .rep-add-btn:hover {
      border-color: #10b981;
      color: #10b981;
      background: rgba(16,185,129,0.1);
    }
  `]
})
export class FormPreviewComponent implements OnChanges {
  @Input({ required: true }) versionId!: number;
  @Input() formTitle: string = '';
  @Input() refreshKey: number = 0;

  private versionService = inject(VersionService);
  private lookupService = inject(LookupService);
  private dir = inject(DirectionService);

  fields = signal<Field[]>([]);
  rules = signal<ConditionalRule[]>([]);
  lookups = signal<Lookup[]>([]);
  loading = signal(false);
  previewValues = signal<Record<string, string>>({});

  /**
   * Visibility map.
   * Fields targeted by any "show" action start HIDDEN.
   * All other fields start VISIBLE.
   * Rules are evaluated left-to-right; show/hide flip visibility.
   */
  private visibilityMap = computed<Record<string, boolean>>(() => {
    const fields = this.fields();
    const rules = this.rules();
    const values = this.previewValues();

    const showTargets = new Set<string>();
    for (const rule of rules) {
      const p = this.parsePayload(rule.conditionJson);
      if (!p) continue;
      for (const a of p.actions) {
        if (a.type === 'show') showTargets.add(a.target_field);
      }
    }

    const vis: Record<string, boolean> = {};
    for (const f of fields) {
      vis[f.fieldKey] = !showTargets.has(f.fieldKey);
    }

    for (const rule of rules) {
      const p = this.parsePayload(rule.conditionJson);
      if (!p) continue;
      const srcVal = values[rule.sourceFieldKey] ?? '';
      if (this.evaluate(p.operator, srcVal, p.value)) {
        for (const a of p.actions) {
          if (a.type === 'show') vis[a.target_field] = true;
          else if (a.type === 'hide') vis[a.target_field] = false;
        }
      }
    }

    return vis;
  });

  visibleFields = computed<Field[]>(() =>
    this.fields()
      .filter(f => this.visibilityMap()[f.fieldKey] !== false)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  );

  ngOnChanges(changes: SimpleChanges) {
    if (changes['versionId'] || changes['refreshKey']) {
      this.reload();
    }
  }

  reload() {
    if (!this.versionId) return;
    this.loading.set(true);
    this.previewValues.set({});

    let done = 0;
    const check = () => { if (++done === 3) this.loading.set(false); };

    this.versionService.getFields(this.versionId).subscribe({
      next: d => { this.fields.set(d); check(); },
      error: () => check()
    });
    this.versionService.getRules(this.versionId).subscribe({
      next: d => { this.rules.set(d); check(); },
      error: () => check()
    });
    this.lookupService.getAll().subscribe({
      next: d => { this.lookups.set(d); check(); },
      error: () => check()
    });
  }

  onValueChange(fieldKey: string, value: string) {
    this.previewValues.update(prev => ({ ...prev, [fieldKey]: value }));
  }

  fieldLabel(field: Field): string {
    return (this.dir.isRtl() && field.labelAr) ? field.labelAr : field.label;
  }

  lookupOptions(lookupId: number | null): LookupValue[] {
    if (!lookupId) return [];
    const lkp = this.lookups().find(l => l.lookupId === lookupId);
    return lkp ? [...lkp.values].sort((a, b) => a.orderIndex - b.orderIndex) : [];
  }

  repeaterSubFields(field: Field): SubField[] {
    if (!field.subFieldsJson) return [];
    try { return JSON.parse(field.subFieldsJson); } catch { return []; }
  }

  repeaterRows(fieldKey: string): Record<string, string>[] {
    const raw = this.previewValues()[fieldKey];
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }

  addRepeaterRow(fieldKey: string) {
    const rows = this.repeaterRows(fieldKey);
    this.onValueChange(fieldKey, JSON.stringify([...rows, {}]));
  }

  removeRepeaterRow(fieldKey: string, index: number) {
    const rows = this.repeaterRows(fieldKey).filter((_, i) => i !== index);
    this.onValueChange(fieldKey, JSON.stringify(rows));
  }

  onRepeaterCellChange(fieldKey: string, rowIndex: number, cellKey: string, value: string) {
    const rows = this.repeaterRows(fieldKey);
    const updated = rows.map((r, i) => i === rowIndex ? { ...r, [cellKey]: value } : r);
    this.onValueChange(fieldKey, JSON.stringify(updated));
  }

  private parsePayload(json: string): ConditionJsonPayload | null {
    try { return JSON.parse(json); } catch { return null; }
  }

  private evaluate(operator: string, actual: string, expected: string): boolean {
    const a = (actual ?? '').toLowerCase().trim();
    const e = (expected ?? '').toLowerCase().trim();
    switch (operator) {
      case 'equals':       return a === e;
      case 'not_equals':   return a !== e;
      case 'contains':     return a.includes(e);
      case 'is_empty':     return a === '';
      case 'is_not_empty': return a !== '';
      default:             return false;
    }
  }
}
