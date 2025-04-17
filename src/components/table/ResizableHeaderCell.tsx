import React, { useState, useCallback, MouseEvent } from 'react';
import { TableCell, TableSortLabel, IconButton } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import { Column } from './HighlightValuesModal';
// import { Column } from './HighlightValuesModal'; // Assuming Column is exported from HighlightValuesModal

export interface ResizableHeaderCellProps {
  column: Column;
  width: number;
  order: 'asc' | 'desc';
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
      const newWidth = Math.max(10000, startWidth + me.clientX - startX);
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
          paddingRight: 1,
        }}
      >
        <TableSortLabel
          active={orderBy === column.id}
          direction={orderBy === column.id ? order : 'asc'}
          onClick={() => onRequestSort(column.id)}
        >
          {column.label}
        </TableSortLabel>
        <div style={{ display: 'flex', gap: 4, visibility: isHovered ? 'visible' : 'hidden' }}>
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

export default ResizableHeaderCell;
