export const formConfigs = {
    ballons: {
      type: 'ballons',
      storageKey: 'LastCalcValues_ballons',
      defaultValues: {
        diameter: 600,
        fabric: 850,
        length: 6000,
        partitions: 2,
        reinforcement: 23.5,
        rollWidth: 2050,
        shape: 1
      },
      fields: [
        { name: 'diameter', label: 'Диаметр, мм:' },
        { name: 'length', label: 'Длина баллона, мм:' },
        { name: 'rollWidth', label: 'Ширина рулона, мм:' },
        { name: 'partitions', label: 'Кол-во перегородок, шт:' },
        { name: 'shape', label: 'Форма баллона:' },
        {
          name: 'fabric',
          label: 'Ткань:',
          type: 'select',
          options: [400, 650, 850, 1100].map(v => ({ label: `${v}г/м2`, value: v }))
        },
        {
          name: 'reinforcement',
          label: 'Усиление:',
          type: 'select',
          options: [
            { label: 'Без усиления', value: 'none' },
            { label: 'Привальный брус 23,5 см', value: 23.5 },
            { label: 'Привальный брус 12 см', value: 12 },
            { label: 'Привальный брус 9 см', value: 9 },
            { label: 'Привальный брус 6 см', value: 6 }
          ]
        }
      ]
    },
  
    fbort: {
      type: 'fbort',
      storageKey: 'LastCalcValues_fbort',
      defaultValues: {
        straightLength: 1900,
        lengthWithRadius: 1800,
        diameter: 250,
        fromCenterToTurn: 675,
        fromCenterToEnd: 0,
        rollWidth: 2050,
        addPartitions: 0,
        fabric: 850
      },
      fields: [
        { name: 'straightLength', label: 'Длина прямого участка, мм:' },
        { name: 'lengthWithRadius', label: 'Длина участка с радиусом, мм:' },
        { name: 'diameter', label: 'Диаметр, мм:' },
        { name: 'fromCenterToTurn', label: 'От центра до начала поворота, мм:' },
        { name: 'fromCenterToEnd', label: 'От центра до конца фальшборта, мм:' },
        { name: 'rollWidth', label: 'Ширина рулона, мм:' },
        { name: 'addPartitions', label: 'Кол-во доп. перегородок, шт:', props: { min: 0, max: 10 } },
        {
          name: 'fabric',
          label: 'Ткань:',
          type: 'select',
          options: [400, 650, 850, 1100].map(v => ({ label: `${v}г/м2`, value: v }))
        }
      ]
    },
  
    mattress: {
      type: 'mattress',
      storageKey: 'LastCalcValues_mattress',
      defaultValues: {
        length: 2000,
        width: 1000,
        height: 230,
        fabric: 850
      },
      fields: [
        { name: 'length', label: 'Длина, мм:' },
        { name: 'width', label: 'Ширина, мм:' },
        { name: 'height', label: 'Высота, мм:' },
        {
          name: 'fabric',
          label: 'Ткань:',
          type: 'select',
          options: [650, 850, 1100].map(v => ({ label: `${v}г/м2`, value: v }))
        }
      ]
    }
  };
  