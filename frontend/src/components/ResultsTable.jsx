import React, { useState, useRef } from 'react';
import { Table, Divider, Space, InputNumber, Typography, Row, Col, Button, Input, message } from 'antd';
import axios from 'axios'
const { TextArea } = Input;
const { Text } = Typography;
const materialColumns = [{
    title: 'Наименование',
    dataIndex: 'name',
    width: '25%',
  },{
    title: 'Количество',
    dataIndex: 'count',
    width: '25%',
  },{
    title: 'Цена (руб.)',
    dataIndex: 'cost',
    width: '25%',
  },{
    title: 'Сумма (руб.)',
    dataIndex: 'summ',
    width: '25%',
  },
]
const buildColumns = [{
    title: 'Наименование',
    dataIndex: 'name',
    width: '33.33%',
  },{
    title: 'Время (мин)',
    dataIndex: 'count',
    width: '33.33%',
  },{
    title: 'Сумма (руб.)',
    dataIndex: 'cost',
    width: '33.33%',
  },
]
const cutColumns = [{
    title: 'Наименование',
    dataIndex: 'name',
    width: '33.33%',
  },{
    title: 'Время (мин)',
    dataIndex: 'count',
    width: '33.33%',
  },{
    title: 'Сумма (руб.)',
    dataIndex: 'cost',
    width: '33.33%',
  },
]
const additionalColumns = [{
    title: 'Наименование',
    dataIndex: 'name',
    width: '25%',
  },{
    title: 'Количество',
    dataIndex: 'count',
    width: '25%',
  },{
    title: 'Цена (руб.)',
    dataIndex: 'cost',
    width: '25%',
  },{
    title: 'Сумма (руб.)',
    dataIndex: 'summ',
    width: '25%',
  },

]
const ResultsTable = ({data, type}) => {
    const [messageApi, contextHolder] = message.useMessage()
    const [markup, setMarkup] = useState(2.4)
    const commentRef = useRef(null);
    const [isDisabled, setIsDisabled] = useState(false)
    let materialData = [], buildData = [], cutData = [], additionalData = null
    let totalPrice = 0
    if(data[type]){
        const values = data[type]
        let key = 1
        for(const item in values.materials){
            const material = values.materials[item] 
            materialData.push({
                key,
                name: item,
                cost: material.cost.toFixed(2),
                count: material.count.toFixed(2),
                summ: (material.cost * material.count).toFixed(2)
            })
            key++
        }
        buildData = [{key, name: 'Стоимость сборки', count: values?.build?.count, cost: values?.build?.cost.toFixed(2)}]
        key++
        cutData = [{key, name: 'Стоимость сборки', count: values?.cut?.count, cost: values?.cut?.cost.toFixed(2)}]
        key++
        if(values.additional)
          additionalData = [{key, name: values.additional.name,
                            count: values.additional.count.toFixed(2),
                            cost: values.additional.cost.toFixed(2),
                            summ: (values.additional.cost * values.additional.count).toFixed(2)}]
        totalPrice = + (data[type].price * markup).toFixed(2);
    }

    const saveData = async () => {
      const comments = commentRef.current?.resizableTextArea?.textArea?.value || ''
      const data = {
        initData: localStorage.getItem(`LastCalcValues_${type}`),
        markup,
        comments,
        type,
        creatorId: localStorage.getItem('id')
      }
      setIsDisabled(true)
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/calc/saveHistory`, data, { withCredentials: true })
        if(response.status === 200){
          messageApi.open({
            type: 'success',
            content: 'Данные сохранены',
            duration: 5
          })
          setIsDisabled(false)
        }
      } catch (error) {
        messageApi.open({
          type: 'error',
          content: error.message,
          duration: 5
        })
        setIsDisabled(false)
      }

    }
    return (
            <>
              {contextHolder}
              <Divider>Материалы</Divider>
              <Table columns={materialColumns} dataSource={materialData} size="small" pagination={false}/>
              <Divider>Раскрой</Divider>
              <Table columns={buildColumns} dataSource={buildData} size="small" pagination={false}/>
              <Divider>Сборка</Divider>
              <Table columns={cutColumns} dataSource={cutData} size="small" pagination={false}/>
              {additionalData && (
                <>
                  <Divider>Дополнительно</Divider>
                  <Table columns={additionalColumns} dataSource={additionalData} size="small" pagination={false}/>
                </>
              )}
              <Divider />
              <Row align={'middle'}>
                <Col span={8} style={{ textAlign: 'left' }}>
                  <Text strong>Себестоимость: {data[type]?.price.toFixed(2).toLocaleString() || 0} руб.</Text>
                </Col>

                <Col span={8} style={{ textAlign: 'center' }}>
                  <Space >
                    <Text strong>Наценка:</Text>
                    <InputNumber
                      min={0}
                      step={0.1}
                      value={markup}
                      onChange={value => setMarkup(value)}
                    />
                  </Space>
                </Col>

                <Col span={8} style={{ textAlign: 'right' }}>
                  <Text strong>Итоговая цена: {totalPrice.toLocaleString()} руб.</Text>
                </Col>
              </Row>
              <Row align="middle" gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col span={8}>
                  <Button  loading={false} size='large' onClick={saveData} disabled={isDisabled}>
                    Сохранить
                  </Button>
                </Col>
                <Col span={4} style={{ textAlign: 'right' }}>
                  <Text strong>Комментарии:</Text>
                </Col>
                <Col span={12}>
                  <TextArea rows={3} style={{ width: '100%', minHeight: 80}} autoSize={true} ref={commentRef}/>
                </Col>
              </Row>
            </>
    )
};
export default ResultsTable;