// components/TableComponent.tsx
import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  MouseEvent,
} from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FilterListIcon from '@mui/icons-material/FilterList';

interface Row {
  id: number;
  name: string;
  age: number;
}

type Order = 'asc' | 'desc';

// Sample data
const rowsData: Row[] = [
  { id: 1, name: 'John Doe', age: 28 },
  { id: 2, name: 'Jane Smith', age: 34 },
  { id: 3, name: 'Alice Johnson', age: 45 },
  { id: 4, name: 'Bob Brown', age: 23 },
  { id: 5, name: 'Carol White', age: 38 },
  { id: 6, name: 'Dan Black', age: 50 },
  { id: 7, name: 'Eve Green', age: 29 },
];

interface Column {
  id: keyof Row;
  label: string;
}

const columns: Column[] = [
  { id: 'id', label: 'ID' },
  { id: 'name', label: 'Name' },
  { id: 'age', label: 'Age' },
];

// Sorting helper functions
function descendingComparator<T>(
  a: T,
  b: T,
  orderBy: keyof T
): number {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}
function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key
) {
  return order === 'desc'
    ? (a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) =>
        descendingComparator(a, b, orderBy)
    : (a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) =>
        -descendingComparator(a, b, orderBy);
}
function stableSort<T>(
  array: readonly T[],
  comparator: (a: T, b: T) => number
): T[] {
  const stabilized = array.map((el, index) => [el, index] as [T, number]);
  stabilized.sort((a, b) => {
    const cmp = comparator(a[0], b[0]);
    return cmp !== 0 ? cmp : a[1] - b[1];
  });
  return stabilized.map((el) => el[0]);
}

// --- Resizable Header Cell with Filter Icon on Hover --- //
interface ResizableHeaderCellProps {
  column: Column;
  width: number;
  order: Order;
  orderBy: keyof Row;
  onRequestSort: (property: keyof Row) => void;
  onWidthChange: (columnId: keyof Row, newWidth: number) => void;
  onFilterClick?: (column: Column) => void;
}

const ResizableHeaderCell: React.FC<ResizableHeaderCellProps> = ({
  column,
  width,
  order,
  orderBy,
  onRequestSort,
  onWidthChange,
  onFilterClick,
}) => {
  // Handle resizing on the right edge using manual events.
  const handleResizeMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;
    const onMouseMove = (moveEvent: Event) => {
      // First cast to unknown then to MouseEvent
      const me = moveEvent as unknown as MouseEvent;
      const newWidth = Math.max(50, startWidth + me.clientX - startX);
      onWidthChange(column.id, newWidth);
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Auto-resize on double-click.
  const handleDoubleClick = useCallback(() => {
    const cells = document.querySelectorAll(`[data-col='${column.id}']`);
    let maxWidth = 0;
    cells.forEach((cell) => {
      const cellEl = cell as HTMLElement;
      const naturalWidth = cellEl.scrollWidth;
      if (naturalWidth > maxWidth) maxWidth = naturalWidth;
    });
    const newWidth = maxWidth + 16;
    onWidthChange(column.id, newWidth);
  }, [column.id, onWidthChange]);

  // Local state for hover to show filter icon.
  const [isHovered, setIsHovered] = useState(false);

  return (
    <TableCell
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width,
        position: 'relative',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        borderRight: '1px solid rgba(0, 0, 0, 0.12)',
      }}
      sortDirection={orderBy === column.id ? order : false}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingRight: 10, // space so icon doesn't overlap text
        }}
      >
        <TableSortLabel
          active={orderBy === column.id}
          direction={orderBy === column.id ? order : 'asc'}
          onClick={() => onRequestSort(column.id)}
        >
          {column.label}
        </TableSortLabel>
        {isHovered && onFilterClick && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onFilterClick(column);
            }}
          >
            <FilterListIcon fontSize="small" />
          </IconButton>
        )}
      </div>
      {/* Resizer handle */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 5,
          cursor: 'col-resize',
          userSelect: 'none',
        }}
        onMouseDown={handleResizeMouseDown}
        onDoubleClick={handleDoubleClick}
      />
    </TableCell>
  );
};

// --- Main Table Component --- //
const TableComponent: React.FC = () => {
  // Sorting, pagination, and column widths state.
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof Row>('id');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [columnWidths, setColumnWidths] = useState<Record<keyof Row, number>>({
    id: 150,
    name: 150,
    age: 150,
  });
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter state and modal state (code omitted for brevity; assume same as previous implementation).
  const [filters, setFilters] = useState<{ [key in keyof Row]?: string[] }>({});
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterModalColumn, setFilterModalColumn] = useState<Column | null>(null);
  const [filterModalOptions, setFilterModalOptions] = useState<
    { value: string; selected: boolean }[]
  >([]);

  // Selected cell state for copy tool.
  const [selectedCellText, setSelectedCellText] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ rowId: number; colId: keyof Row } | null>(null);

  // On mount: measure container width and set equal initial column widths.
  useEffect(() => {
    if (containerRef.current) {
      const cw = containerRef.current.clientWidth;
      setContainerWidth(cw);
      const equalWidth = Math.floor(cw / columns.length);
      const initialWidths: Record<keyof Row, number> = {} as Record<keyof Row, number>;
      columns.forEach((col) => {
        initialWidths[col.id] = equalWidth;
      });
      setColumnWidths(initialWidths);
    }
  }, []);

  // Updated handleWidthChange: when shrinking a column, adjust designated expander.
  const handleWidthChange = (columnId: keyof Row, newWidth: number) => {
    setColumnWidths((prev) => {
      const oldWidth = prev[columnId];
      const newWidths = { ...prev, [columnId]: newWidth };
      // When shrinking (new width is less than old width) adjust the designated expander.
      if (containerWidth && newWidth < oldWidth) {
        const resizedIndex = columns.findIndex((col) => col.id === columnId);
        // If resized column is NOT the last column, use the last column as expander;
        // if resized column is the last column, use the first column as expander.
        const designatedIndex =
          resizedIndex === columns.length - 1 ? 0 : columns.length - 1;
        const designatedColId = columns[designatedIndex].id;
        let sumOthers = 0;
        columns.forEach((col) => {
          if (col.id !== designatedColId) {
            sumOthers += newWidths[col.id];
          }
        });
        let newExpanderWidth = containerWidth - sumOthers;
        if (newExpanderWidth < 50) newExpanderWidth = 50;
        newWidths[designatedColId] = newExpanderWidth;
      }
      return newWidths;
    });
  };

  const handleRequestSort = (property: keyof Row) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const totalWidth = Object.values(columnWidths).reduce((sum, w) => sum + w, 0);

  // Filtering: filter rows by allowed values.
  const filteredRows = rowsData.filter((row) => {
    for (const colId in filters) {
      const allowed = filters[colId as keyof Row];
      if (allowed && allowed.length > 0) {
        if (!allowed.includes(row[colId as keyof Row].toString())) {
          return false;
        }
      }
    }
    return true;
  });
  const sortedRows = stableSort(filteredRows, getComparator(order, orderBy));
  const paginatedRows = sortedRows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Open filter modal when filter icon is clicked.
  const handleFilterClick = (column: Column) => {
    const valuesSet = new Set<string>();
    rowsData.forEach((row) => {
      valuesSet.add(row[column.id].toString());
    });
    const options = Array.from(valuesSet).map((val) => ({
      value: val,
      selected: true,
    }));
    setFilterModalOptions(options);
    setFilterModalColumn(column);
    setFilterModalOpen(true);
  };

  const handleOptionChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterModalOptions((prev) => {
      const newOptions = [...prev];
      newOptions[index].selected = event.target.checked;
      return newOptions;
    });
  };

  const handleApplyFilter = () => {
    if (filterModalColumn) {
      const selectedValues = filterModalOptions.filter(opt => opt.selected).map(opt => opt.value);
      setFilters((prev) => ({
        ...prev,
        [filterModalColumn.id]: selectedValues,
      }));
    }
    setFilterModalOpen(false);
  };

  const handleCancelFilter = () => {
    setFilterModalOpen(false);
  };

  // Handle cell click for copy tool.
  const handleCellClick = (rowId: number, colId: keyof Row, cellText: string) => {
    setSelectedCellText(cellText);
    setSelectedCell({ rowId, colId });
  };

  const handleCopy = async () => {
    if (selectedCellText) {
      try {
        await navigator.clipboard.writeText(selectedCellText);
        console.log('Copied:', selectedCellText);
      } catch (error) {
        console.error('Copy failed:', error);
      }
    }
  };

  return (
    <div ref={containerRef}>
      {/* Top tool row for copy */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, p: 1 }}>
        <IconButton onClick={handleCopy} disabled={!selectedCellText}>
          <ContentCopyIcon />
        </IconButton>
        {selectedCellText && (
          <TextField
            variant="outlined"
            size="small"
            value={selectedCellText}
            InputProps={{ readOnly: true }}
            sx={{ ml: 1, flexGrow: 1 }}
          />
        )}
      </Box>

      {/* Filter Modal */}
      <Dialog open={filterModalOpen} onClose={handleCancelFilter} maxWidth="xs" fullWidth>
        <DialogTitle>
          Filter {filterModalColumn ? filterModalColumn.label : ''}
        </DialogTitle>
        <DialogContent dividers sx={{ maxHeight: 300, display: 'flex', flexDirection: 'column' }}>
          {/* Select All Option */}
          <FormControlLabel
            control={
              <Checkbox
                checked={filterModalOptions.every((opt) => opt.selected)}
                onChange={(e) => {
                  const selectAll = e.target.checked;
                  setFilterModalOptions((prev) =>
                    prev.map((opt) => ({ ...opt, selected: selectAll }))
                  );
                }}
              />
            }
            label="Select All"
          />
          {filterModalOptions.map((option, index) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  checked={option.selected}
                  onChange={handleOptionChange(index)}
                />
              }
              label={option.value}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleApplyFilter} variant="contained" color="primary">
            Apply
          </Button>
          <Button onClick={handleCancelFilter}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Table */}
      <TableContainer component={Paper} sx={{ mt: 2, overflowX: 'auto', transition: 'background-color 0.5s ease, color 0.5s ease' }}>
        <Table
          sx={{
            tableLayout: 'fixed',
            width: totalWidth < containerWidth ? containerWidth : totalWidth,
            borderCollapse: 'separate',
            borderSpacing: 0,
          }}
        >
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <ResizableHeaderCell
                  key={col.id}
                  column={col}
                  width={columnWidths[col.id]}
                  order={order}
                  orderBy={orderBy}
                  onRequestSort={handleRequestSort}
                  onWidthChange={handleWidthChange}
                  onFilterClick={handleFilterClick}
                />
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.map((row) => (
              <TableRow key={row.id}>
                {columns.map((col) => {
                  const isSelected =
                    selectedCell &&
                    selectedCell.rowId === row.id &&
                    selectedCell.colId === col.id;
                  return (
                    <TableCell
                      key={col.id}
                      style={{
                        width: columnWidths[col.id],
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        border: isSelected
                          ? '2px solid #dc004e'
                          : '1px solid rgba(0, 0, 0, 0.12)',
                        borderRadius: isSelected ? '4px' : undefined,
                      }}
                      data-col={col.id}
                      onClick={() =>
                        handleCellClick(row.id, col.id, row[col.id].toString())
                      }
                    >
                      {row[col.id]}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredRows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </div>
  );
};

export default TableComponent;
