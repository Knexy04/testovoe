import React, { useState, useEffect, useCallback, useRef } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import axios from 'axios';

const App = () => {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  
  // Для Drag and Drop
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const listRef = useRef(null);

  // Загрузка данных
  const loadData = useCallback(async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      const { data } = await axios.get('https://api.testovoe.knexy.xyz/api/items', {
        params: { query: search, offset: currentOffset, limit: 20 }
      });

      setItems(prev => 
        reset ? data.items : [...prev, ...data.items.filter(i => !prev.includes(i))]
      );
      setOffset(currentOffset + 20);
      setHasMore(data.items.length === 20);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    }
  }, [search, offset]);

  // Загрузка состояния
  useEffect(() => {
    const initialize = async () => {
      try {
        const [state, data] = await Promise.all([
          axios.get('https://api.testovoe.knexy.xyz/api/state'),
          axios.get('https://api.testovoe.knexy.xyz/api/items', { params: { offset: 0 } })
        ]);

        setSelectedIds(new Set(state.data.selectedIds));
        setItems(data.data.items);
        setOffset(20);
      } catch (error) {
        console.error('Ошибка инициализации:', error);
      }
    };
    initialize();
  }, []);

  // Обработка поиска
  const handleSearch = useCallback((e) => {
    setSearch(e.target.value);
    loadData(true);
  }, [loadData]);

  // Выбор элемента
  const toggleSelect = useCallback(async (item) => {
    const newSelected = new Set(selectedIds);
    newSelected.has(item) ? newSelected.delete(item) : newSelected.add(item);
    
    try {
      await axios.post('https://api.testovoe.knexy.xyz/api/state', {
        selectedIds: Array.from(newSelected),
        sortedOrder: items
      });
      setSelectedIds(newSelected);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  }, [selectedIds, items]);

  // Начало перетаскивания
  const handleDragStart = (e, index) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', null);
  };

  // Процесс перетаскивания
  const handleDragOver = (e, index) => {
    e.preventDefault();
    dragOverItem.current = index;
    
    // Плавная прокрутка при достижении краев
    const { clientY } = e;
    const { top, bottom } = listRef.current.getBoundingClientRect();
    const scrollSpeed = 20;

    if (clientY < top + 50) {
      window.scrollBy(0, -scrollSpeed);
    } else if (clientY > bottom - 50) {
      window.scrollBy(0, scrollSpeed);
    }
  };

  // Завершение перетаскивания
  const handleDrop = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;

    const newItems = [...items];
    const draggedItem = newItems[dragItem.current];
    
    newItems.splice(dragItem.current, 1);
    newItems.splice(dragOverItem.current, 0, draggedItem);

    try {
      setItems(newItems);
      await axios.post('https://api.testovoe.knexy.xyz/api/state', {
        selectedIds: Array.from(selectedIds),
        sortedOrder: newItems
      });
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setItems(items);
    }

    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Стиль для перетаскиваемого элемента
  const getItemStyle = (isDragging, index) => ({
    userSelect: 'none',
    cursor: 'grab',
    background: isDragging ? '#f0f0f0' : selectedIds.has(items[index]) ? '#e3f2fd' : '#fff',
    transform: isDragging ? 'scale(1.02)' : 'none',
    opacity: isDragging ? 0.8 : 1,
    transition: 'all 0.3s ease',
  });

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>Список чисел (1-1,000,000)</h1>
      <input
        type="text"
        value={search}
        onChange={handleSearch}
        placeholder="Поиск..."
        style={{ width: '100%', padding: '10px', marginBottom: '20px' }}
      />

      <InfiniteScroll
        dataLength={items.length}
        next={loadData}
        hasMore={hasMore}
        loader={<div style={{ padding: '10px', textAlign: 'center' }}>Загрузка...</div>}
        endMessage={<p style={{ textAlign: 'center' }}>Конец списка</p>}
        scrollableTarget="scrollableDiv"
      >
        <div 
          ref={listRef}
          style={{ minHeight: '100vh' }}
        >
          {items.map((item, index) => (
            <div
              key={item}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDrop}
              style={getItemStyle(
                dragItem.current === index,
                index
              )}
              className="list-item"
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px',
                  margin: '5px 0',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(item)}
                  onChange={() => toggleSelect(item)}
                  style={{ marginRight: '10px' }}
                />
                <span>{item}</span>
              </div>
            </div>
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
};

export default App;