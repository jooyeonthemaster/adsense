'use client';

import { Table, TableBody } from '@/components/ui/table';
import type { SheetData } from '../types';
import { RecordTableHeader } from './RecordTableHeader';
import { RecordTableRow } from './RecordTableRow';

interface RecordsTableProps {
  sheet: SheetData;
}

export function RecordsTable({ sheet }: RecordsTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="max-h-[400px] overflow-auto">
        <Table>
          <RecordTableHeader productType={sheet.productType} />
          <TableBody>
            {sheet.records.map((record, idx) => (
              <RecordTableRow key={idx} record={record} productType={sheet.productType} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
