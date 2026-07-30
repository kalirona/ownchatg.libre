import React, { useCallback, useEffect, useRef, useState, memo, useMemo } from 'react';
import { JSX } from 'react/jsx-runtime';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Row,
  ColumnDef,
  flexRender,
  SortingState,
  useReactTable,
  getCoreRowModel,
  VisibilityState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from '@tanstack/react-table';
import type { Table as TTable } from '@tanstack/react-table';
import { Table, TableRow, TableBody, TableCell, TableHead, TableHeader } from './Table';
import { useMediaQuery, useLocalize, TranslationKeys } from '~/hooks';
import AnimatedSearchInput from './AnimatedSearchInput';
import { TrashIcon, Spinner } from '~/svgs';
import { Skeleton } from './Skeleton';
import { Checkbox } from './Checkbox';
import { Button } from './Button';
import { cn } from '~/utils';

type TableColumn<TData, TValue> = ColumnDef<TData, TValue> & {
  meta?: {
    size?: string | number;
    mobileSize?: string | number;
    minWidth?: string | number;
  };
};

const SelectionCheckbox = memo(
  ({
    checked,
    onChange,
    ariaLabel,
  }: {
    checked: boolean;
    onChange: (value: boolean) => void;
    ariaLabel: string;
  }) => (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.stopPropagation()}
      className="flex h-full w-[30px] items-center justify-center"
      onClick={(e) => e.stopPropagation()}
    >
      <Checkbox checked={checked} onCheckedChange={onChange} aria-label={ariaLabel} />
    </div>
  ),
);

SelectionCheckbox.displayName = 'SelectionCheckbox';

interface DataTableProps<TData, TValue> {
  columns: TableColumn<TData, TValue>[];
  data: TData[];
  onDelete?: (selectedRows: TData[]) => Promise<void>;
  filterColumn?: string;
  defaultSort?: SortingState;
  columnVisibilityMap?: Record<string, string>;
  className?: string;
  pageSize?: number;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: (options?: unknown) => Promise<unknown>;
  enableRowSelection?: boolean;
  showCheckboxes?: boolean;
  onFilterChange?: (value: string) => void;
  filterValue?: string;
  isLoading?: boolean;
  enableSearch?: boolean;
}

const TableRowComponent = <TData, TValue>({
  row,
  isSmallScreen,
  onSelectionChange,
  index,
  isSearching,
}: {
  row: Row<TData>;
  isSmallScreen: boolean;
  onSelectionChange?: (rowId: string, selected: boolean) => void;
  index: number;
  isSearching: boolean;
}) => {
  const handleSelection = useCallback(
    (value: boolean) => {
      row.toggleSelected(value);
      onSelectionChange?.(row.id, value);
    },
    [row, onSelectionChange],
  );

  return (
    <TableRow
      data-state={row.getIsSelected() ? 'selected' : undefined}
      className="motion-safe:animate-fadeIn border-b border-border-light transition-all duration-300 ease-out hover:bg-surface-secondary"
      style={{
        animationDelay: `${index * 20}ms`,
        transform: `translateY(${isSearching ? '4px' : '0'})`,
        opacity: isSearching ? 0.5 : 1,
      }}
    >
      {row.getVisibleCells().map((cell) => {
        if (cell.column.id === 'select') {
          return (
            <TableCell key={cell.id} className="px-2 py-1 transition-all duration-300">
              <SelectionCheckbox
                checked={row.getIsSelected()}
                onChange={handleSelection}
                ariaLabel="Select row"
              />
            </TableCell>
          );
        }

        if (cell.column.id === 'title') {
          return (
            <TableHead
              key={cell.id}
              className="w-0 max-w-0 px-2 py-1 align-middle text-xs transition-all duration-300 sm:px-4 sm:py-2 sm:text-sm"
              style={getColumnStyle(
                cell.column.columnDef as TableColumn<TData, TValue>,
                isSmallScreen,
              )}
              scope="row"
            >
              <div className="overflow-visible text-ellipsis">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            </TableHead>
          );
        }

        return (
          <TableCell
            key={cell.id}
            className="w-0 max-w-0 overflow-visible px-2 py-1 align-middle text-xs transition-all duration-300 sm:px-4 sm:py-2 sm:text-sm"
            style={getColumnStyle(
              cell.column.columnDef as TableColumn<TData, TValue>,
              isSmallScreen,
            )}
          >
            <div className="overflow-visible text-ellipsis">
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          </TableCell>
        );
      })}
    </TableRow>
  );
};

const MemoizedTableRow = memo(TableRowComponent) as typeof TableRowComponent;

function getColumnStyle<TData, TValue>(
  column: TableColumn<TData, TValue>,
  isSmallScreen: boolean,
): React.CSSProperties {
  return {
    width: isSmallScreen ? column.meta?.mobileSize : column.meta?.size,
    minWidth: column.meta?.minWidth,
    maxWidth: column.meta?.size,
  };
}

const DeleteButton = memo(
  ({
    onDelete,
    isDeleting,
    disabled,
    isSmallScreen,
    ariaLabel,
  }: {
    onDelete?: () => Promise<void>;
    isDeleting: boolean;
    disabled: boolean;
    isSmallScreen: boolean;
    ariaLabel: string;
  }) => {
    if (!onDelete) {
      return null;
    }
    return (
      <Button
        variant="outline"
        onClick={onDelete}
        disabled={disabled}
        className={cn('min-w-[40px] transition-all duration-200', isSmallScreen && 'px-2 py-1')}
        aria-label={ariaLabel}
      >
        {isDeleting ? (
          <Spinner className="size-4" />
        ) : (
          <>
            <TrashIcon className="size-3.5 text-red-400 sm:size-4" />
            {!isSmallScreen && <span className="ml-2">Delete</span>}
          </>
        )}
      </Button>
    );
  },
);

export default function DataTable<TData, TValue>({
  columns,
  data,
  onDelete,
  filterColumn,
  defaultSort = [],
  className = '',
  isFetchingNextPage = false,
  hasNextPage = false,
  fetchNextPage,
  enableRowSelection = true,
  showCheckboxes = true,
  onFilterChange,
  filterValue,
  isLoading,
  enableSearch = true,
}: DataTableProps<TData, TValue>): JSX.Element {
  const localize = useLocalize();
  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [sorting, setSorting] = useState<SortingState>(defaultSort);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [searchTerm, setSearchTerm] = useState(filterValue ?? '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResultsAnnouncement, setSearchResultsAnnouncement] = useState('');

  const tableColumns = useMemo(() => {
    if (!enableRowSelection || !showCheckboxes) {
      return columns;
    }
    const selectColumn = {
      id: 'select',
      header: ({ table }: { table: TTable<TData> }) => (
        <div className="flex h-full w-[30px] items-center justify-center">
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }: { row: Row<TData> }) => (
        <SelectionCheckbox
          checked={row.getIsSelected()}
          onChange={(value) => row.toggleSelected(value)}
          ariaLabel="Select row"
        />
      ),
      meta: { size: '50px' },
    };
    return [selectColumn, ...columns];
  }, [columns, enableRowSelection, showCheckboxes]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection,
    enableMultiRowSelection: true,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: useCallback(() => 48, []),
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0 ? totalSize - virtualRows[virtualRows.length - 1].end : 0;

  useEffect(() => {
    const scrollElement = tableContainerRef.current;
    if (!scrollElement) {
      return;
    }

    const handleScroll = async () => {
      if (!hasNextPage || isFetchingNextPage) {
        return;
      }
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      if (scrollHeight - scrollTop <= clientHeight * 1.5) {
        try {
          // Safely fetch next page without breaking if lastPage is undefined
          await fetchNextPage?.();
        } catch (error) {
          console.error('Unable to fetch next page:', error);
        }
      }
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    setIsSearching(true);
    const timeout = setTimeout(() => {
      onFilterChange?.(searchTerm);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm, onFilterChange]);

  useEffect(() => {
    if (!searchTerm.trim() || isSearching) {
      setSearchResultsAnnouncement('');
      return;
    }

    const resultCount = rows.length;
    const announcement =
      resultCount === 1
        ? localize('com_ui_result_found' as TranslationKeys, {
            count: resultCount,
          })
        : localize('com_ui_results_found' as TranslationKeys, {
            count: resultCount,
          });

    const timeout = setTimeout(() => {
      setSearchResultsAnnouncement(announcement);
    }, 300);

    return () => clearTimeout(timeout);
  }, [rows.length, searchTerm, isSearching, localize]);

  const handleDelete = useCallback(async () => {
    if (!onDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      const itemsToDelete = table.getFilteredSelectedRowModel().rows.map((r) => r.original);
      await onDelete(itemsToDelete);
      setRowSelection({});
    } finally {
      setIsDeleting(false);
    }
  }, [onDelete, table]);

  const getRandomWidth = () => Math.floor(Math.random() * (410 - 170 + 1)) + 170;

  const skeletons = Array.from({ length: 13 }, (_, index) => {
    const randomWidth = getRandomWidth();
    const firstDataColumnIndex = tableColumns[0]?.id === 'select' ? 1 : 0;

    return (
      <TableRow key={index} className="motion-safe:animate-fadeIn border-b border-border-light">
        {tableColumns.map((column, columnIndex) => {
          const style = getColumnStyle(column as TableColumn<TData, TValue>, isSmallScreen);
          const isFirstDataColumn = columnIndex === firstDataColumnIndex;

          return (
            <TableCell key={column.id} className="px-2 py-1 sm:px-4 sm:py-2" style={style}>
              <Skeleton
                className="h-6"
                style={isFirstDataColumn ? { width: `${randomWidth}px` } : { width: '100%' }}
              />
            </TableCell>
          );
        })}
      </TableRow>
    );
  });

  return (
    <div className={cn('flex h-full flex-col gap-4', className)}>
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {searchResultsAnnouncement}
      </div>

            {/* Selected row counter */}
            {Object.keys(rowSelection).length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary">
                <span>{Object.keys(rowSelection).length} selected</span>
              </div>
            )}

            {/* Table controls */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {enableRowSelection && showCheckboxes && (
                <DeleteButton
                  onDelete={handleDelete}
                  isDeleting={isDeleting}
                  disabled={!table.getFilteredSelectedRowModel().rows.length || isDeleting}
                  isSmallScreen={isSmallScreen}
                  ariaLabel={localize('com_ui_delete_selected_items')}
                />
              )}
              {filterColumn !== undefined && table.getColumn(filterColumn) && enableSearch && (
                <div className="relative flex-1">
                  <AnimatedSearchInput
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    isSearching={isSearching}
                    placeholder="Search..."
                  />
                </div>
              )}
            </div>

      {/* Virtualized table */}
      <div
        ref={tableContainerRef}
        className={cn(
          'relative min-h-0 max-w-full flex-1 overflow-x-auto overflow-y-auto rounded-md border border-black/10 dark:border-white/10',
          'transition-all duration-300 ease-out',
          isSearching && 'bg-surface-secondary/50',
          className,
        )}
      >
        <Table
          unwrapped
          className="w-full min-w-[300px] table-fixed border-separate border-spacing-0"
        >
          <TableHeader className="sticky top-0 z-50 bg-surface-secondary">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-border-light">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="whitespace-nowrap bg-surface-secondary px-2 py-2 text-left text-sm font-medium text-text-secondary sm:px-4"
                    style={getColumnStyle(
                      header.column.columnDef as TableColumn<TData, TValue>,
                      isSmallScreen,
                    )}
                    onClick={
                      header.column.getCanSort()
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                    scope="col"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} />
              </tr>
            )}

            {isLoading && skeletons}

            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <MemoizedTableRow
                  key={row.id}
                  row={row}
                  isSmallScreen={isSmallScreen}
                  index={virtualRow.index}
                  isSearching={isSearching}
                />
              );
            })}

            {!virtualRows.length && !isLoading && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="p-8 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="size-12 text-text-secondary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6Zm9 0A2.25 2.25 0 0 1 15 3.75h2.25A2.25 2.25 0 0 1 20 6v2.25a2.25 2.25 0 0 1-2.25 2.25h-2.25A2.25 2.25 0 0 1 15 8.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25Zm9 0A2.25 2.25 0 0 1 15 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25h-2.25A2.25 2.25 0 0 1 15 18v-2.25Z"
                      />
                    </svg>
                    <p className="text-sm text-text-secondary">No data available</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}

            {/* Loading indicator */}
            {(isFetchingNextPage || hasNextPage) && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="p-4">
                  <div className="flex h-full items-center justify-center">
                    {isFetchingNextPage ? (
                      <Spinner className="size-4" />
                    ) : (
                      hasNextPage && <div className="h-6" />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
