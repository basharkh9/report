// components/DynamicTable.tsx
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
import ColorLensIcon from '@mui/icons-material/ColorLens';
import { useDispatch, useSelector } from 'react-redux';
import { loadBugs } from '../store/bugs';
import { useTheme, lighten, darken } from '@mui/material/styles';
import HighlightValuesModal, { HighlightMapping, Column } from './table/HighlightValuesModal';

interface DynamicTableProps {
  columns: Column[];
  data: Record<string, any>[];
}

type Order = 'asc' | 'desc';

//
// Sorting helper functions
//
function descendingComparator<T>(
  a: T,
  b: T,
  orderBy: string
): number {
  if ((b as any)[orderBy] < (a as any)[orderBy]) return -1;
  if ((b as any)[orderBy] > (a as any)[orderBy]) return 1;
  return 0;
}

function getComparator(order: Order, orderBy: string) {
  return order === 'desc'
    ? (a: Record<string, any>, b: Record<string, any>) =>
      descendingComparator(a, b, orderBy)
    : (a: Record<string, any>, b: Record<string, any>) =>
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

//
// Resizable Header Cell with Filter and Highlight Icons on Hover
//
interface ResizableHeaderCellProps {
  column: Column;
  width: number;
  order: Order;
  orderBy: string;
  onRequestSort: (property: string) => void;
  onWidthChange: (columnId: string, newWidth: number) => void;
  onFilterClick?: (column: Column) => void;
  onHighlightClick?: (column: Column) => void;
}

const ResizableHeaderCell: React.FC<ResizableHeaderCellProps> = ({
  column,
  width,
  order,
  orderBy,
  onRequestSort,
  onWidthChange,
  onFilterClick,
  onHighlightClick,
}) => {
  const handleResizeMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;
    const onMouseMove = (moveEvent: Event) => {
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
          paddingRight: 10,
        }}
      >
        <TableSortLabel
          active={orderBy === column.id}
          direction={orderBy === column.id ? order : 'asc'}
          onClick={() => onRequestSort(column.id)}
        >
          {column.label}
        </TableSortLabel>
        {isHovered && (
          <div style={{ display: 'flex', gap: 4 }}>
            {onFilterClick && (
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
            {onHighlightClick && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onHighlightClick(column);
                }}
              >
                <ColorLensIcon fontSize="small" />
              </IconButton>
            )}
          </div>
        )}
      </div>
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

//
// DynamicTable Component
const DynamicTable: React.FC<any> = () => {
  const theme = useTheme();
  const [order, setOrder] = useState<Order>('asc');
  const bugsColumns = useSelector((state: any) => state.entities?.bugs?.columns || []);
  const data = useSelector((state: any) => state.entities?.bugs?.list || []);
  const [orderBy, setOrderBy] = useState<string>(bugsColumns[0]?.id || '');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    bugsColumns.forEach((col: Column) => {
      initial[col.id] = 150;
    });
    return initial;
  });
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Listen for window resize and update the container width.
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    return () => window.removeEventListener('resize', updateContainerWidth);
  }, []);

  // Filtering state.
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});

  // Filter modal state.
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterModalColumn, setFilterModalColumn] = useState<Column | null>(null);
  const [filterModalOptions, setFilterModalOptions] = useState<{ value: string; selected: boolean }[]>([]);
  const [filterSearchQuery, setFilterSearchQuery] = useState<string>('');

  // Highlight modal state.
  const [highlightModalOpen, setHighlightModalOpen] = useState(false);
  const [highlightModalColumn, setHighlightModalColumn] = useState<Column | null>(null);
  const [highlightMapping, setHighlightMapping] = useState<Record<string, HighlightMapping>>({});

  const dispatch = useDispatch();
  const bugs = useSelector((state: any) => state.entities?.bugs?.list || []);
  useEffect(() => {
    dispatch((loadBugs() as unknown) as any);
  }, [dispatch]);

  const [selectedCellText, setSelectedCellText] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; colId: string } | null>(null);

  const handleCopy = async () => {
    if (selectedCellText) {
      try {
        await navigator.clipboard.writeText(selectedCellText);
      } catch (error) {
        console.error('Copy failed:', error);
      }
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      const cw = containerRef.current.clientWidth;
      setContainerWidth(cw);
      const equalWidth = Math.floor(cw / bugsColumns.length);
      const initialWidths: Record<string, number> = {};
      bugsColumns.forEach((col: Column) => {
        initialWidths[col.id] = equalWidth;
      });
      setColumnWidths(initialWidths);
    }
  }, [bugsColumns]);

  const handleWidthChange = (columnId: string, newWidth: number) => {
    setColumnWidths((prev) => {
      const oldWidth = prev[columnId];
      const newWidths = { ...prev, [columnId]: newWidth };
      if (containerWidth && newWidth < oldWidth) {
        const resizedIndex = bugsColumns.findIndex((col: Column) => col.id === columnId);
        const designatedIndex = resizedIndex === bugsColumns.length - 1 ? 0 : bugsColumns.length - 1;
        const designatedColId = bugsColumns[designatedIndex].id;
        let sumOthers = 0;
        bugsColumns.forEach((col: Column) => {
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

  const handleRequestSort = (property: string) => {
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

  const filteredData = data.filter((row: Record<string, any>) => {
    for (const colId in filters) {
      const allowed = filters[colId];
      if (allowed && allowed.length > 0) {
        if (!allowed.includes(row[colId]?.toString())) {
          return false;
        }
      }
    }
    return true;
  });

  const sortedData = stableSort(filteredData, getComparator(order, orderBy));
  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleFilterClick = (column: Column) => {
    setFilterSearchQuery('');
    const valuesSet = new Set<string>();
    data.forEach((row: Record<string, any>) => {
      const cellVal = row[column.id];
      if (cellVal != null) {
        valuesSet.add(cellVal.toString());
      }
    });
    const options = Array.from(valuesSet).map((val) => ({ value: val, selected: true }));
    setFilterModalOptions(options);
    setFilterModalColumn(column);
    setFilterModalOpen(true);
  };

  const handleHighlightClick = (column: Column) => {
    setHighlightModalColumn(column);
    setHighlightModalOpen(true);
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
      const selectedValues = filterModalOptions.filter((opt) => opt.selected).map((opt) => opt.value);
      setFilters((prev) => ({ ...prev, [filterModalColumn.id]: selectedValues }));
    }
    setPage(0);
    setFilterModalOpen(false);
  };

  const handleCancelFilter = () => {
    setFilterModalOpen(false);
  };

  const displayedOptions = filterModalOptions.filter((opt) =>
    opt.value.toLowerCase().includes(filterSearchQuery.toLowerCase())
  );

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
            inputProps={{ readOnly: true }}
            sx={{ ml: 1, flexGrow: 1 }}
          />
        )}
      </Box>

      {/* Filter Modal */}
      <Dialog open={filterModalOpen} onClose={handleCancelFilter} maxWidth="xs" fullWidth>
        <DialogTitle>
          Filter {filterModalColumn ? filterModalColumn.label : ''}
        </DialogTitle>
        <DialogContent
          dividers
          sx={{ maxHeight: 300, display: 'flex', flexDirection: 'column' }}
        >
          <TextField
            label="Search"
            variant="outlined"
            value={filterSearchQuery}
            onChange={(e) => setFilterSearchQuery(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={displayedOptions.length > 0 && displayedOptions.every((opt) => opt.selected)}
                onChange={(e) => {
                  const selectAll = e.target.checked;
                  setFilterModalOptions((prev) =>
                    prev.map((opt) =>
                      opt.value.toLowerCase().includes(filterSearchQuery.toLowerCase())
                        ? { ...opt, selected: selectAll }
                        : opt
                    )
                  );
                }}
              />
            }
            label="Select All"
          />
          {displayedOptions.map((option, index) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  checked={option.selected}
                  onChange={handleOptionChange(
                    filterModalOptions.findIndex((o) => o.value === option.value)
                  )}
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

      {/* Highlight Modal */}
      {highlightModalColumn && (
        <HighlightValuesModal
          open={highlightModalOpen}
          column={highlightModalColumn}
          data={data}
          onClose={() => setHighlightModalOpen(false)}
          onApply={(mapping) => {
            if (highlightModalColumn) {
              setHighlightMapping((prev) => ({
                ...prev,
                [highlightModalColumn.id]: mapping,
              }));
              console.log("Mapping for", highlightModalColumn.label, mapping);
            }
          }}
        />
      )}

      {/* Table */}
      <TableContainer
        component={Paper}
        sx={{
          mt: 2,
          overflowX: 'auto',
          transition: 'background-color 0.5s ease, color 0.5s ease',
        }}
      >
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
              {bugsColumns.map((col: Column) => (
                <ResizableHeaderCell
                  key={col.id}
                  column={col}
                  width={columnWidths[col.id]}
                  order={order}
                  orderBy={orderBy}
                  onRequestSort={handleRequestSort}
                  onWidthChange={handleWidthChange}
                  onFilterClick={handleFilterClick}
                  onHighlightClick={handleHighlightClick}
                />
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {bugsColumns.map((col: Column) => {
                  const isSelected =
                    selectedCell &&
                    selectedCell.rowIndex === rowIndex &&
                    selectedCell.colId === col.id;
                  const cellValue = row[col.id]?.toString() || '';
                  let cellHighlight: string | undefined = undefined;
                  const mapping = highlightMapping[col.id];
                  if (mapping) {
                    if (mapping.rangeMapping) {
                      const numValue = parseFloat(cellValue);
                      if (!isNaN(numValue) &&
                        numValue >= mapping.rangeMapping.min &&
                        numValue <= mapping.rangeMapping.max) {
                        cellHighlight = mapping.rangeMapping.color;
                      }
                    }
                    if (!cellHighlight && mapping.groupMapping && mapping.groupMapping[cellValue]) {
                      cellHighlight = mapping.groupMapping[cellValue];
                    }
                  }
                  const adjustedColor = cellHighlight
                    ? theme.palette.mode === 'dark'
                      ? darken(cellHighlight, 0.6)
                      : lighten(cellHighlight, 0.6)
                    : undefined;
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
                        backgroundColor: adjustedColor, // Use the adjusted color if available.
                        transition: 'background-color 0.5s ease, color 0.5s ease',
                      }}
                      data-col={col.id}
                      onClick={() => {
                        setSelectedCellText(cellValue);
                        setSelectedCell({ rowIndex, colId: col.id });
                      }}
                    >
                      {cellValue}
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
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </div>
  );
};

export default DynamicTable;
