// Modelo de Disponibilidad/Horarios - Supabase + Fallback en memoria
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

// Horarios por defecto en memoria
let memoryAvailability = [
  { id: '1', day_of_week: 0, start_time: '00:00', end_time: '00:00', is_available: false }, // Domingo
  { id: '2', day_of_week: 1, start_time: '09:00', end_time: '20:00', is_available: true },  // Lunes
  { id: '3', day_of_week: 2, start_time: '09:00', end_time: '20:00', is_available: true },  // Martes
  { id: '4', day_of_week: 3, start_time: '09:00', end_time: '20:00', is_available: true },  // Miércoles
  { id: '5', day_of_week: 4, start_time: '09:00', end_time: '20:00', is_available: true },  // Jueves
  { id: '6', day_of_week: 5, start_time: '09:00', end_time: '20:00', is_available: true },  // Viernes
  { id: '7', day_of_week: 6, start_time: '09:00', end_time: '14:00', is_available: true }   // Sábado
];

let memoryBlockedTimes = [];
let blockedIdCounter = 1;
let useMemoryFallback = false; // Flag para usar memoria si tabla no existe

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Helper para verificar si es error de tabla no existe
const isTableNotFoundError = (error) => {
  return error && (error.code === 'PGRST205' || error.message?.includes('not find the table'));
};

class Availability {
  // Obtener todos los horarios
  static async getAll() {
    if (isSupabaseConfigured() && !useMemoryFallback) {
      try {
        const { data, error } = await supabaseAdmin
          .from('availability')
          .select('*')
          .order('day_of_week', { ascending: true });

        if (error) {
          if (isTableNotFoundError(error)) {
            console.log('[Availability] Tabla no existe, usando fallback en memoria');
            useMemoryFallback = true;
            return this.getAll();
          }
          throw error;
        }

        // Si no hay datos, insertar por defecto
        if (!data || data.length === 0) {
          for (const avail of memoryAvailability) {
            await supabaseAdmin.from('availability').insert({
              day_of_week: avail.day_of_week,
              start_time: avail.start_time,
              end_time: avail.end_time,
              is_available: avail.is_available
            });
          }
          return this.getAll();
        }

        return data.map(d => ({
          ...d,
          day_name: dayNames[d.day_of_week]
        }));
      } catch (err) {
        if (isTableNotFoundError(err)) {
          console.log('[Availability] Tabla no existe, usando fallback en memoria');
          useMemoryFallback = true;
          return this.getAll();
        }
        throw err;
      }
    }

    return memoryAvailability.map(d => ({
      ...d,
      day_name: dayNames[d.day_of_week]
    }));
  }

  // Obtener horario de un día específico
  static async getByDay(dayOfWeek) {
    if (isSupabaseConfigured() && !useMemoryFallback) {
      try {
        const { data, error } = await supabaseAdmin
          .from('availability')
          .select('*')
          .eq('day_of_week', dayOfWeek)
          .single();

        if (error) {
          if (isTableNotFoundError(error)) {
            useMemoryFallback = true;
            return this.getByDay(dayOfWeek);
          }
          if (error.code !== 'PGRST116') throw error;
        }
        return data ? { ...data, day_name: dayNames[dayOfWeek] } : null;
      } catch (err) {
        if (isTableNotFoundError(err)) {
          useMemoryFallback = true;
          return this.getByDay(dayOfWeek);
        }
        throw err;
      }
    }

    const avail = memoryAvailability.find(a => a.day_of_week === dayOfWeek);
    return avail ? { ...avail, day_name: dayNames[dayOfWeek] } : null;
  }

  // Actualizar horario de un día
  static async update(dayOfWeek, updateData) {
    const updates = {};
    if (updateData.startTime !== undefined) updates.start_time = updateData.startTime;
    if (updateData.start_time !== undefined) updates.start_time = updateData.start_time;
    if (updateData.endTime !== undefined) updates.end_time = updateData.endTime;
    if (updateData.end_time !== undefined) updates.end_time = updateData.end_time;
    if (updateData.isAvailable !== undefined) updates.is_available = updateData.isAvailable;
    if (updateData.is_available !== undefined) updates.is_available = updateData.is_available;

    if (isSupabaseConfigured() && !useMemoryFallback) {
      try {
        const { data, error } = await supabaseAdmin
          .from('availability')
          .update(updates)
          .eq('day_of_week', dayOfWeek)
          .select()
          .single();

        if (error) {
          if (isTableNotFoundError(error)) {
            useMemoryFallback = true;
            return this.update(dayOfWeek, updateData);
          }
          throw error;
        }
        return { ...data, day_name: dayNames[dayOfWeek] };
      } catch (err) {
        if (isTableNotFoundError(err)) {
          useMemoryFallback = true;
          return this.update(dayOfWeek, updateData);
        }
        throw err;
      }
    }

    const index = memoryAvailability.findIndex(a => a.day_of_week === dayOfWeek);
    if (index !== -1) {
      memoryAvailability[index] = {
        ...memoryAvailability[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      return { ...memoryAvailability[index], day_name: dayNames[dayOfWeek] };
    }
    return null;
  }

  // Verificar si un horario está disponible
  static async isTimeAvailable(date, time) {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    // Verificar horario del día
    const dayAvail = await this.getByDay(dayOfWeek);
    if (!dayAvail || !dayAvail.is_available) {
      return false;
    }

    // Verificar si está dentro del horario
    if (time < dayAvail.start_time || time >= dayAvail.end_time) {
      return false;
    }

    // Verificar bloqueos
    const blocked = await this.getBlockedTimes();
    const dateTime = new Date(`${date}T${time}`);

    for (const block of blocked) {
      const blockStart = new Date(block.start_datetime);
      const blockEnd = new Date(block.end_datetime);
      if (dateTime >= blockStart && dateTime < blockEnd) {
        return false;
      }
    }

    return true;
  }

  // Obtener slots disponibles para una fecha
  static async getAvailableSlots(date, durationMinutes = 60) {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    const dayAvail = await this.getByDay(dayOfWeek);
    if (!dayAvail || !dayAvail.is_available) {
      return [];
    }

    const slots = [];
    const [startHour, startMin] = dayAvail.start_time.split(':').map(Number);
    const [endHour, endMin] = dayAvail.end_time.split(':').map(Number);

    let currentTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    while (currentTime + durationMinutes <= endTime) {
      const hour = Math.floor(currentTime / 60);
      const min = currentTime % 60;
      const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

      const available = await this.isTimeAvailable(date, timeStr);
      slots.push({
        time: timeStr,
        available
      });

      currentTime += 30; // Intervalos de 30 minutos
    }

    return slots;
  }

  // =====================================================
  // BLOQUEOS DE HORARIO
  // =====================================================

  // Obtener bloqueos
  static async getBlockedTimes() {
    if (isSupabaseConfigured() && !useMemoryFallback) {
      try {
        const { data, error } = await supabaseAdmin
          .from('blocked_times')
          .select('*')
          .gte('end_datetime', new Date().toISOString())
          .order('start_datetime', { ascending: true });

        if (error) {
          if (isTableNotFoundError(error)) {
            useMemoryFallback = true;
            return this.getBlockedTimes();
          }
          throw error;
        }
        return data || [];
      } catch (err) {
        if (isTableNotFoundError(err)) {
          useMemoryFallback = true;
          return this.getBlockedTimes();
        }
        throw err;
      }
    }

    return memoryBlockedTimes.filter(b => new Date(b.end_datetime) >= new Date());
  }

  // Crear bloqueo
  static async createBlock(blockData) {
    const newBlock = {
      start_datetime: blockData.startDatetime || blockData.start_datetime,
      end_datetime: blockData.endDatetime || blockData.end_datetime,
      reason: blockData.reason || null
    };

    if (isSupabaseConfigured() && !useMemoryFallback) {
      try {
        const { data, error } = await supabaseAdmin
          .from('blocked_times')
          .insert(newBlock)
          .select()
          .single();

        if (error) {
          if (isTableNotFoundError(error)) {
            useMemoryFallback = true;
            return this.createBlock(blockData);
          }
          throw error;
        }
        return data;
      } catch (err) {
        if (isTableNotFoundError(err)) {
          useMemoryFallback = true;
          return this.createBlock(blockData);
        }
        throw err;
      }
    }

    const memoryBlock = {
      id: `block-${blockedIdCounter++}`,
      ...newBlock,
      created_at: new Date().toISOString()
    };
    memoryBlockedTimes.push(memoryBlock);
    return memoryBlock;
  }

  // Eliminar bloqueo
  static async deleteBlock(id) {
    if (isSupabaseConfigured() && !useMemoryFallback) {
      try {
        const { error } = await supabaseAdmin
          .from('blocked_times')
          .delete()
          .eq('id', id);

        if (error) {
          if (isTableNotFoundError(error)) {
            useMemoryFallback = true;
            return this.deleteBlock(id);
          }
          throw error;
        }
        return true;
      } catch (err) {
        if (isTableNotFoundError(err)) {
          useMemoryFallback = true;
          return this.deleteBlock(id);
        }
        throw err;
      }
    }

    const index = memoryBlockedTimes.findIndex(b => b.id === id);
    if (index !== -1) {
      memoryBlockedTimes.splice(index, 1);
      return true;
    }
    return false;
  }
}

module.exports = Availability;
